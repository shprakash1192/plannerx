from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Keep these names because deps_auth imports them
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"  # simplest for now; you can make this configurable later

# Argon2 avoids Python 3.12 bcrypt/passlib issues
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    minutes = expires_minutes if expires_minutes is not None else settings.JWT_EXPIRE_MINUTES
    expire = datetime.utcnow() + timedelta(minutes=minutes)
    payload: Dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)