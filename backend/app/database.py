from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings

# 字符集在连接层指定,连接串保持无查询参数,便于测试时按库名替换
engine = create_engine(get_settings().database_url, connect_args={"charset": "utf8mb4"})
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session
