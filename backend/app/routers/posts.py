from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database import get_session
from app.models import Article, PublishStatus
from app.schemas import PostDetail, PostList, PostListItem

router = APIRouter(prefix="/api", tags=["posts"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/posts", response_model=PostList)
def list_posts(
    session: SessionDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 10,
) -> PostList:
    where = Article.status == PublishStatus.published
    total = session.scalar(select(func.count()).select_from(Article).where(where))
    articles = session.scalars(
        select(Article)
        .options(joinedload(Article.category), selectinload(Article.tags))
        .where(where)
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
