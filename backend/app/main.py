import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.config import get_settings
from app.database import SessionLocal, engine
from app.models import Base
from app.routers import admin, posts
from starlette.middleware.sessions import SessionMiddleware

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 起步阶段用 create_all 管理表结构;引入 Alembic 前重置 = DROP/CREATE DATABASE(见 README)
    if get_settings().auto_create_tables:
        try:
            Base.metadata.create_all(bind=engine)
        except OperationalError:
            logger.warning("database unreachable, skipped table bootstrap — check backend/.env")
    yield


app = FastAPI(title="SakiBlog API", lifespan=lifespan)

# Session 先加(CORS 需保持最外层,后添加的中间件在外层)
app.add_middleware(SessionMiddleware, secret_key=get_settings().secret_key, max_age=7 * 24 * 3600)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(posts.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
        database = "up"
    except OperationalError:
        database = "down"
    return {"status": "ok", "database": database}
