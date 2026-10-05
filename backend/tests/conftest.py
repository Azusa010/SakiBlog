import os
from pathlib import Path

from dotenv import load_dotenv

# pytest 从 backend/ 目录运行;先加载 .env,再强制指向测试库
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

_dev_url = os.environ.get("DATABASE_URL", "mysql+pymysql://sakiblog:sakiblog@localhost:3306/sakiblog")
os.environ["DATABASE_URL"] = f"{_dev_url.rpartition('/')[0]}/sakiblog_test"
os.environ["AUTO_CREATE_TABLES"] = "false"

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal, engine
from app.main import app
from app.models import Article, Base, Category, PublishStatus, Tag


@pytest.fixture()
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(fresh_db):
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def seed(fresh_db):
    """1 个分类、2 个标签、3 篇已发布 + 1 草稿 + 1 已撤回。返回各篇文章 id。"""
    with SessionLocal() as s:
        cat = Category(name="技术")
        t1, t2 = Tag(name="fastapi"), Tag(name="vue")
        s.add_all([cat, t1, t2])
        s.flush()

        def article(title, status, published_at, with_meta=False):
            a = Article(
                title=title,
                summary=f"{title}的摘要",
                content=f"# {title}\n\n正文",
                status=status,
                published_at=published_at,
            )
            if with_meta:
                a.category = cat
                a.tags = [t1, t2]
                a.reading_minutes = 5
                a.cover_image = "https://example.com/cover.png"
            s.add(a)
            return a

        from datetime import datetime

        p1 = article("第一篇", PublishStatus.published, datetime(2026, 1, 1), with_meta=True)
        p2 = article("第二篇", PublishStatus.published, datetime(2026, 2, 1))
        p3 = article("第三篇", PublishStatus.published, datetime(2026, 3, 1))
        d = article("草稿", PublishStatus.draft, None)
        w = article("撤回", PublishStatus.withdrawn, datetime(2025, 12, 1))
        s.commit()
        return {"published": [p1.id, p2.id, p3.id], "draft": d.id, "withdrawn": w.id}
