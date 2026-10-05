from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Enum as SAEnum, ForeignKey, Index, String, Table, Text, func
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class PublishStatus(str, Enum):
    draft = "draft"
    published = "published"
    withdrawn = "withdrawn"


# 文章-标签关联:复合主键,双方级联删除,杜绝孤立关联(SRS §4.6)
article_tag = Table(
    "article_tag",
    Base.metadata,
    Column("article_id", ForeignKey("article.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tag.id", ondelete="CASCADE"), primary_key=True),
    mysql_charset="utf8mb4",
)


class Admin(Base):
    __tablename__ = "admin"
    __table_args__ = {"mysql_charset": "utf8mb4"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class Category(Base):
    __tablename__ = "category"
    __table_args__ = {"mysql_charset": "utf8mb4"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)

    articles: Mapped[list["Article"]] = relationship(back_populates="category")


class Tag(Base):
    __tablename__ = "tag"
    __table_args__ = {"mysql_charset": "utf8mb4"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)


class Article(Base):
    __tablename__ = "article"
    __table_args__ = (
        # 服务 FR-LIST-002「已发布、按发布时间从新到旧」的列表查询
        Index("ix_article_status_published_at", "status", "published_at"),
        {"mysql_charset": "utf8mb4"},
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200))
    summary: Mapped[str] = mapped_column(String(500))
    # 中文 Markdown 正文可能远超 64KB,MySQL 下用 LONGTEXT
    content: Mapped[str] = mapped_column(Text().with_variant(LONGTEXT(), "mysql"))
    status: Mapped[PublishStatus] = mapped_column(SAEnum(PublishStatus), default=PublishStatus.draft)
    cover_image: Mapped[str | None] = mapped_column(String(500))
    reading_minutes: Mapped[int | None]
    version: Mapped[int] = mapped_column(default=1, server_default="1")
    category_id: Mapped[int | None] = mapped_column(ForeignKey("category.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    published_at: Mapped[datetime | None] = mapped_column(DateTime)

    category: Mapped["Category | None"] = relationship(back_populates="articles")
    tags: Mapped[list["Tag"]] = relationship(secondary=article_tag, passive_deletes=True)
