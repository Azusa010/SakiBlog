"""密码哈希与登录防护(NFR-SEC-005 / NFR-SEC-009)。"""

import time

import bcrypt

# ponytail: 登录失败计数存进程内存,单实例部署够用;多实例时改用数据库或 Redis
_MAX_FAILURES = 5
_FAILURE_WINDOW = 15 * 60
_login_failures: dict[str, list[float]] = {}


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def _recent_failures(username: str) -> list[float]:
    now = time.monotonic()
    recent = [t for t in _login_failures.get(username, []) if now - t < _FAILURE_WINDOW]
    _login_failures[username] = recent
    return recent


def login_blocked(username: str) -> bool:
    return len(_recent_failures(username)) >= _MAX_FAILURES


def register_login_failure(username: str) -> None:
    _login_failures.setdefault(username, []).append(time.monotonic())


def clear_login_failures(username: str) -> None:
    _login_failures.pop(username, None)


def reset_login_guard() -> None:
    """仅供测试:清空失败计数。"""
    _login_failures.clear()
