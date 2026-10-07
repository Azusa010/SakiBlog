FROM python:3.13-slim

WORKDIR /app

# 安装 uv 高速包管理器
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# 复制依赖元数据
COPY pyproject.toml uv.lock* ./

# 安装生产依赖 (排除开发测试包)
RUN uv sync --frozen --no-dev --no-install-project

# 复制后端业务源码
COPY app/ ./app/

ENV PATH="/app/.venv/bin:$PATH"
ENV PORT=8000

EXPOSE 8000

# 动态适配云厂商随机分配的 PORT 环境变量
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
