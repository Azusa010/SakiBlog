import os
from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings

connect_args: dict[str, Any] = {"charset": "utf8mb4"}
db_url = get_settings().database_url

# 自动适配云数据库 (如 TiDB Cloud Serverless / Aiven 等强制需要 TLS/SSL 的环境)
if any(keyword in db_url.lower() for keyword in ["tidb", "ssl", "gateway"]):
    ca_candidates = [
        "/etc/ssl/certs/ca-certificates.crt",  # Debian / Ubuntu (标准 Docker 容器路径)
        "/etc/pki/tls/certs/ca-bundle.crt",     # CentOS / RHEL
        "/etc/ssl/ca-bundle.pem",               # Alpine
    ]
    ca_path = next((p for p in ca_candidates if os.path.exists(p)), None)
    if ca_path:
        connect_args["ssl"] = {"ca": ca_path}
    else:
        connect_args["ssl"] = {}

# 字符集在连接层指定,连接串保持无查询参数,便于测试时按库名替换
engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        yield session
