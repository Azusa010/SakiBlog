from datetime import datetime

from pydantic import BaseModel, ConfigDict


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
