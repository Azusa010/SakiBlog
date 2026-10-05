from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database import get_session
from app.models import Article, Category, PublishStatus, Tag, article_tag
from app.schemas import (
    CategoryWithCount,
    PostDetail,
    PostList,
    PostListItem,
    SearchResult,
    TagWithCount,
)

router = APIRouter(prefix="/api", tags=["posts"])

SessionDep = Annotated[Session, Depends(get_session)]


def _published_count(session: Session, *conditions) -> int:
    return session.scalar(
        select(func.count()).select_from(Article).where(Article.status == PublishStatus.published, *conditions)
    )


@router.get("/posts", response_model=PostList)
def list_posts(
    session: SessionDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 10,
    category_id: Annotated[int | None, Query()] = None,
    tag_id: Annotated[int | None, Query()] = None,
) -> PostList:
    where = [Article.status == PublishStatus.published]
    if category_id is not None:
        where.append(Article.category_id == category_id)
    if tag_id is not None:
        where.append(Article.tags.any(Tag.id == tag_id))
    total = _published_count(session, *where)
    articles = session.scalars(
        select(Article)
        .options(joinedload(Article.category), selectinload(Article.tags))
        .where(*where)
        .order_by(Article.published_at.desc(), Article.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PostList(
        items=[PostListItem.model_validate(a) for a in articles],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/posts/{post_id}", response_model=PostDetail)
def get_post(post_id: int, session: SessionDep) -> PostDetail:
    # 草稿/已撤回文章对访客一律 404,绝不泄露内容(FR-ARTICLE-008 / NFR-SEC-006)
    article = session.get(Article, post_id)
    if article is None or article.status != PublishStatus.published:
        raise HTTPException(status_code=404, detail="post not found")
    return PostDetail.model_validate(article)


@router.get("/search", response_model=SearchResult)
def search_posts(session: SessionDep, q: Annotated[str, Query()]) -> SearchResult:
    # 空白关键词不触发搜索(FR-SEARCH-003)
    term = q.strip()
    if not term:
        raise HTTPException(status_code=422, detail="empty query")
    like = f"%{term}%"
    match = or_(
        Article.title.like(like),
        Article.summary.like(like),
        Article.category.has(Category.name.like(like)),
        Article.tags.any(Tag.name.like(like)),
    )
    articles = session.scalars(
        select(Article)
        .options(joinedload(Article.category), selectinload(Article.tags))
        .where(Article.status == PublishStatus.published, match)
        .order_by(Article.published_at.desc(), Article.id.desc())
    ).all()
    return SearchResult(query=term, total=len(articles), items=[PostListItem.model_validate(a) for a in articles])


@router.get("/categories", response_model=list[CategoryWithCount])
def list_categories(session: SessionDep) -> list[CategoryWithCount]:
    # 内连接自然排除没有公开文章的分类(FR-CATEGORY-001)
    rows = session.execute(
        select(Category.id, Category.name, func.count(Article.id).label("article_count"))
        .join(
            Article,
            (Article.category_id == Category.id) & (Article.status == PublishStatus.published),
        )
        .group_by(Category.id, Category.name)
        .order_by(Category.name)
    ).all()
    return [CategoryWithCount(id=r.id, name=r.name, article_count=r.article_count) for r in rows]


@router.get("/categories/{category_id}", response_model=CategoryWithCount)
def get_category(category_id: int, session: SessionDep) -> CategoryWithCount:
    category = session.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="category not found")
    return CategoryWithCount(
        id=category.id,
        name=category.name,
        article_count=_published_count(session, Article.category_id == category_id),
    )


@router.get("/tags", response_model=list[TagWithCount])
def list_tags(session: SessionDep) -> list[TagWithCount]:
    rows = session.execute(
        select(Tag.id, Tag.name, func.count(Article.id).label("article_count"))
        .join(article_tag, article_tag.c.tag_id == Tag.id)
        .join(
            Article,
            (Article.id == article_tag.c.article_id) & (Article.status == PublishStatus.published),
        )
        .group_by(Tag.id, Tag.name)
        .order_by(Tag.name)
    ).all()
    return [TagWithCount(id=r.id, name=r.name, article_count=r.article_count) for r in rows]


@router.get("/tags/{tag_id}", response_model=TagWithCount)
def get_tag(tag_id: int, session: SessionDep) -> TagWithCount:
    tag = session.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="tag not found")
    return TagWithCount(
        id=tag.id,
        name=tag.name,
        article_count=_published_count(session, Article.tags.any(Tag.id == tag_id)),
    )
