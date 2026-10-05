from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "mysql+pymysql://sakiblog:sakiblog@localhost:3306/sakiblog"
    auto_create_tables: bool = True
    # 签名会话 Cookie 的密钥;生产环境必须在 .env 里换掉
    secret_key: str = "dev-secret-change-me"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
