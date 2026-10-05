"""创建或重置管理员账户(SRS §2.3.2:第一阶段仅一个管理员,无自助注册)。

用法(在 backend/ 目录):
    uv run python -m app.create_admin <用户名>                # 交互式输入密码
    uv run python -m app.create_admin <用户名> <密码>        # 非交互(密码会留在 shell 历史,谨慎使用)
密码至少 8 位;用户名已存在时重置其密码。
"""

import getpass
import sys

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Admin
from app.security import hash_password


def main() -> None:
    if len(sys.argv) not in (2, 3):
        print(__doc__)
        raise SystemExit(1)
    username = sys.argv[1]
    if len(sys.argv) == 3:
        password = sys.argv[2]
    else:
        password = getpass.getpass("密码(至少 8 位): ")
    if len(password) < 8:
        raise SystemExit("密码至少 8 位")

    with SessionLocal() as session:
        admin = session.scalars(select(Admin).where(Admin.username == username)).first()
        if admin is None:
            session.add(Admin(username=username, password_hash=hash_password(password)))
            message = f"已创建管理员 {username}"
        else:
            admin.password_hash = hash_password(password)
            message = f"已重置 {username} 的密码"
        session.commit()
    print(message)


if __name__ == "__main__":
    main()
