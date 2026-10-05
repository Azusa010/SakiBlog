# backend

FastAPI + SQLAlchemy 2 + MySQL 8.4 的后端服务,用 [uv](https://docs.astral.sh/uv/) 管理依赖。

## 管理端

创建或重置管理员账户(密码至少 8 位):

```bash
uv run python -m app.create_admin <用户名>
```

- 管理端 API 全部在 `/api/admin/*`,由签名会话 Cookie(`SECRET_KEY`)保护。
- 登录连续失败 5 次会触发 15 分钟的限制(NFR-SEC-009)。

## 首次配置

1. 创建数据库和专用用户(在 MySQL 中执行;密码请自行替换):

   ```sql
   CREATE DATABASE sakiblog CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   CREATE DATABASE sakiblog_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   CREATE USER 'sakiblog'@'localhost' IDENTIFIED BY 'sakiblog';
   GRANT ALL PRIVILEGES ON sakiblog.* TO 'sakiblog'@'localhost';
   GRANT ALL PRIVILEGES ON sakiblog_test.* TO 'sakiblog'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. 复制 `.env.example` 为 `.env`,按需修改连接串。
3. `uv sync` 安装依赖。

## 常用命令

```bash
uv run uvicorn app.main:app --reload   # 启动开发服务(http://127.0.0.1:8000/docs 看接口文档)
uv run pytest                          # 运行测试(自动使用 sakiblog_test 库)
uv run ruff check .                    # 静态检查
```

## 重置数据库

表结构由 `AUTO_CREATE_TABLES`(`Base.metadata.create_all`)启动时自动创建。需要完全重来时:

```sql
DROP DATABASE sakiblog;
CREATE DATABASE sakiblog CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

重启服务即可重新建表。正式迁移工具(Alembic)按 SRS §2.6 留待后续引入。

## 验证数据

建表后可插入一篇文章验证接口:

```sql
USE sakiblog;
INSERT INTO category (name) VALUES ('技术');
INSERT INTO article (title, summary, content, status, published_at)
VALUES ('你好,SakiBlog', '第一篇文章的摘要', '# 你好\n\n世界', 'published', NOW());
```

然后访问 `http://127.0.0.1:8000/api/posts` 应能看到这篇文章。
