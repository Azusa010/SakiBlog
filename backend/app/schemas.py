from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

from app.models import PublishStatus


class CategoryBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class TagBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class PostListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    summary: str
    cover_image: str | None = None
    reading_minutes: int | None = None
    published_at: datetime
    category: CategoryBrief | None = None
    tags: list[TagBrief] = []


class PostDetail(PostListItem):
    content: str
    updated_at: datetime


class PostList(BaseModel):
    items: list[PostListItem]
    total: int
    page: int
    page_size: int


class CategoryWithCount(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    article_count: int


class TagWithCount(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    article_count: int


class SearchResult(BaseModel):
    query: str
    total: int
    items: list[PostListItem]


# ---------- 管理端 ----------


class LoginPayload(BaseModel):
    username: str
    password: str


class AdminPostBase(BaseModel):
    title: Annotated[str, StringConstraints(min_length=1, max_length=200)]
    summary: Annotated[str, StringConstraints(min_length=1, max_length=500)]
    content: Annotated[str, StringConstraints(min_length=1)]
    category_id: int | None = None
    tag_ids: list[int] = []


class AdminPostCreate(AdminPostBase):
    pass


class AdminPostUpdate(AdminPostBase):
    # 乐观锁:客户端必须携带它读取到的版本号(FR-ADMIN-ARTICLE-010)
    version: int


class AdminPostSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: PublishStatus
    version: int
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None = None
    category: CategoryBrief | None = None
    tags: list[TagBrief] = []


class AdminPostDetail(AdminPostSummary):
    content: str


class TaxonomyPayload(BaseModel):
    name: Annotated[str, StringConstraints(min_length=1, max_length=50)]
