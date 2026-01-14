from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

# ✅ match your config.py names
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"

# ✅ no native deps needed (no cffi, no bcrypt)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(
    sub: str,
    extra: Optional[dict] = None,
    expires_minutes: Optional[int] = None,
) -> str:
    minutes = expires_minutes or settings.JWT_EXPIRE_MINUTES
    expire = datetime.utcnow() + timedelta(minutes=minutes)

    payload: Dict[str, Any] = {"sub": sub, "exp": expire}
    if extra:
        payload.update(extra)

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)