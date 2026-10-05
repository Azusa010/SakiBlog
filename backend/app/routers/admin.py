"""管理端 API:认证与内容管理(NFR-SEC-006:全部端点要求已认证)。"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database import get_session
from app.models import Admin, Article, Category, PublishStatus, Tag, article_tag
from app.schemas import (
    AdminPostCreate,
    AdminPostDetail,
    AdminPostSummary,
    AdminPostUpdate,
    CategoryWithCount,
    LoginPayload,
    TagWithCount,
    TaxonomyPayload,
)
from app.security import (
    clear_login_failures,
    login_blocked,
    register_login_failure,
    verify_password,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

SessionDep = Annotated[Session, Depends(get_session)]


def require_admin(request: Request, session: SessionDep) -> Admin:
    admin_id = request.session.get("admin_id")
    admin = session.get(Admin, admin_id) if admin_id is not None else None
    if admin is None or admin.status != "active":
        raise HTTPException(status_code=401, detail="登录状态已失效,请重新登录")
    return admin


AdminDep = Annotated[Admin, Depends(require_admin)]


@router.post("/login")
def login(payload: LoginPayload, request: Request, session: SessionDep) -> dict[str, str]:
    if login_blocked(payload.username):
        raise HTTPException(status_code=429, detail="尝试过于频繁,请稍后再试")
    admin = session.scalars(select(Admin).where(Admin.username == payload.username)).first()
    if admin is None or admin.status != "active" or not verify_password(payload.password, admin.password_hash):
        register_login_failure(payload.username)
        # 统一错误信息,不泄露账户是否存在(FR-AUTH-002)
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    clear_login_failures(payload.username)
    request.session["admin_id"] = admin.id
    return {"username": admin.username}


@router.get("/me")
def me(admin: AdminDep) -> dict[str, str]:
    return {"username": admin.username}


@router.post("/logout")
def logout(request: Request, admin: AdminDep) -> dict[str, str]:
    request.session.clear()
    return {"status": "ok"}


# ---------- 文章管理(FR-ADMIN-ARTICLE) ----------


def _load_article_or_404(post_id: int, session: Session) -> Article:
    article = session.get(Article, post_id)
    if article is None:
        raise HTTPException(status_code=404, detail="post not found")
    return article


def _apply_taxonomy(article: Article, payload: AdminPostCreate | AdminPostUpdate, session: Session) -> None:
    if payload.category_id is not None:
        if session.get(Category, payload.category_id) is None:
            raise HTTPException(status_code=422, detail="分类不存在")
    article.category_id = payload.category_id
    if payload.tag_ids:
        tags = session.scalars(select(Tag).where(Tag.id.in_(payload.tag_ids))).all()
        if len(tags) != len(set(payload.tag_ids)):
            raise HTTPException(status_code=422, detail="标签不存在")
        article.tags = list(tags)
    else:
        article.tags = []


@router.get("/posts", response_model=list[AdminPostSummary])
def admin_list_posts(
    admin: AdminDep,
    session: SessionDep,
    status: Annotated[PublishStatus | None, Query()] = None,
) -> list[AdminPostSummary]:
    """全部状态的文章;status 过滤(FR-ADMIN-ARTICLE-001)。"""
    stmt = (
        select(Article)
        .options(joinedload(Article.category), selectinload(Article.tags))
        .order_by(Article.updated_at.desc(), Article.id.desc())
    )
    if status is not None:
        stmt = stmt.where(Article.status == status)
    return [AdminPostSummary.model_validate(a) for a in session.scalars(stmt).unique().all()]


@router.get("/posts/{post_id}", response_model=AdminPostDetail)
def admin_get_post(post_id: int, admin: AdminDep, session: SessionDep) -> AdminPostDetail:
    return AdminPostDetail.model_validate(_load_article_or_404(post_id, session))


@router.post("/posts", response_model=AdminPostDetail, status_code=201)
def admin_create_post(
    payload: AdminPostCreate, admin: AdminDep, session: SessionDep
) -> AdminPostDetail:
    article = Article(title=payload.title, summary=payload.summary, content=payload.content)
    _apply_taxonomy(article, payload, session)
    session.add(article)
    session.commit()
    return AdminPostDetail.model_validate(article)


@router.put("/posts/{post_id}", response_model=AdminPostDetail)
def admin_update_post(
    post_id: int, payload: AdminPostUpdate, admin: AdminDep, session: SessionDep
) -> AdminPostDetail:
    article = _load_article_or_404(post_id, session)
    # 乐观锁:版本落后即拒绝,避免静默覆盖(FR-ADMIN-ARTICLE-010)
    if article.version != payload.version:
        raise HTTPException(status_code=409, detail="文章已被修改过,请刷新获取最新内容")
    article.title = payload.title
    article.summary = payload.summary
    article.content = payload.content
    _apply_taxonomy(article, payload, session)
    article.version += 1
    session.commit()
    return AdminPostDetail.model_validate(article)


@router.post("/posts/{post_id}/publish", response_model=AdminPostDetail)
def admin_publish_post(post_id: int, admin: AdminDep, session: SessionDep) -> AdminPostDetail:
    article = _load_article_or_404(post_id, session)
    article.status = PublishStatus.published
    article.published_at = func.now()  # 每次发布刷新发布时间,由数据库统一时间基准
    session.commit()
    session.refresh(article)
    return AdminPostDetail.model_validate(article)


@router.post("/posts/{post_id}/withdraw", response_model=AdminPostDetail)
def admin_withdraw_post(post_id: int, admin: AdminDep, session: SessionDep) -> AdminPostDetail:
    article = _load_article_or_404(post_id, session)
    article.status = PublishStatus.withdrawn
    session.commit()
    return AdminPostDetail.model_validate(article)


@router.delete("/posts/{post_id}", status_code=204)
def admin_delete_post(post_id: int, admin: AdminDep, session: SessionDep) -> None:
    article = _load_article_or_404(post_id, session)
    session.delete(article)
    session.commit()


# ---------- 分类管理(FR-ADMIN-CATEGORY) ----------


def _category_in_use(session: Session, category_id: int) -> int:
    return session.scalar(
        select(func.count()).select_from(Article).where(Article.category_id == category_id)
    )


@router.get("/categories", response_model=list[CategoryWithCount])
def admin_list_categories(admin: AdminDep, session: SessionDep) -> list[CategoryWithCount]:
    """全部分类(含空分类);article_count 为任意状态的关联文章数。"""
    rows = session.execute(
        select(Category.id, Category.name, func.count(Article.id).label("article_count"))
        .outerjoin(Article, Article.category_id == Category.id)
        .group_by(Category.id, Category.name)
        .order_by(Category.name)
    ).all()
    return [CategoryWithCount(id=r.id, name=r.name, article_count=r.article_count) for r in rows]


@router.post("/categories", response_model=CategoryWithCount, status_code=201)
def admin_create_category(
    payload: TaxonomyPayload, admin: AdminDep, session: SessionDep
) -> CategoryWithCount:
    if session.scalars(select(Category).where(Category.name == payload.name)).first():
        raise HTTPException(status_code=409, detail="分类名称已存在")
    category = Category(name=payload.name)
    session.add(category)
    session.commit()
    return CategoryWithCount(id=category.id, name=category.name, article_count=0)


@router.put("/categories/{category_id}", response_model=CategoryWithCount)
def admin_rename_category(
    category_id: int, payload: TaxonomyPayload, admin: AdminDep, session: SessionDep
) -> CategoryWithCount:
    category = session.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="category not found")
    duplicate = session.scalars(
        select(Category).where(Category.name == payload.name, Category.id != category_id)
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="分类名称已存在")
    category.name = payload.name
    session.commit()
    return CategoryWithCount(
        id=category.id,
        name=category.name,
        article_count=_category_in_use(session, category_id),
    )


@router.delete("/categories/{category_id}", status_code=204)
def admin_delete_category(category_id: int, admin: AdminDep, session: SessionDep) -> None:
    category = session.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="category not found")
    # 仍有关联文章时禁止删除(FR-ADMIN-CATEGORY-004)
    if _category_in_use(session, category_id) > 0:
        raise HTTPException(status_code=409, detail="该分类下仍有文章,请先移除文章的分类")
    session.delete(category)
    session.commit()


# ---------- 标签管理(FR-ADMIN-TAG) ----------


def _tag_in_use(session: Session, tag_id: int) -> int:
    return session.scalar(
        select(func.count())
        .select_from(Article)
        .join(Article.tags)
        .where(Tag.id == tag_id)
    )


@router.get("/tags", response_model=list[TagWithCount])
def admin_list_tags(admin: AdminDep, session: SessionDep) -> list[TagWithCount]:
    """全部标签(含未使用的);article_count 为关联文章数(任意状态)。"""
    rows = session.execute(
        select(Tag.id, Tag.name, func.count(article_tag.c.article_id).label("article_count"))
        .outerjoin(article_tag, article_tag.c.tag_id == Tag.id)
        .group_by(Tag.id, Tag.name)
        .order_by(Tag.name)
    ).all()
    return [TagWithCount(id=r.id, name=r.name, article_count=r.article_count) for r in rows]


@router.post("/tags", response_model=TagWithCount, status_code=201)
def admin_create_tag(payload: TaxonomyPayload, admin: AdminDep, session: SessionDep) -> TagWithCount:
    if session.scalars(select(Tag).where(Tag.name == payload.name)).first():
        raise HTTPException(status_code=409, detail="标签名称已存在")
    tag = Tag(name=payload.name)
    session.add(tag)
    session.commit()
    return TagWithCount(id=tag.id, name=tag.name, article_count=0)


@router.put("/tags/{tag_id}", response_model=TagWithCount)
def admin_rename_tag(
    tag_id: int, payload: TaxonomyPayload, admin: AdminDep, session: SessionDep
) -> TagWithCount:
    tag = session.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="tag not found")
    duplicate = session.scalars(
        select(Tag).where(Tag.name == payload.name, Tag.id != tag_id)
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="标签名称已存在")
    tag.name = payload.name
    session.commit()
    return TagWithCount(id=tag.id, name=tag.name, article_count=_tag_in_use(session, tag_id))


@router.delete("/tags/{tag_id}", status_code=204)
def admin_delete_tag(tag_id: int, admin: AdminDep, session: SessionDep) -> None:
    # 删除标签只移除关联,不影响文章(FR-ADMIN-TAG-004);确认提示由前端负责
    tag = session.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="tag not found")
    session.delete(tag)
    session.commit()
