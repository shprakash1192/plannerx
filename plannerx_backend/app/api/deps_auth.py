from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user import User

bearer = HTTPBearer(auto_error=False)

def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = creds.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_sysadmin(user: User = Depends(get_current_user)) -> User:
    if user.role != "SYSADMIN":
        raise HTTPException(status_code=403, detail="SYSADMIN only")
    return user

def require_sysadmin_global(user: User = Depends(require_sysadmin)) -> User:
    # SYSADMIN is "global" only when not tunneled into a company
    if user.company_id is not None:
        raise HTTPException(status_code=403, detail="SYSADMIN is tunneled; leave company to manage global companies")
    return user

def require_company_admin_or_sysadmin(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("SYSADMIN", "COMPANY_ADMIN"):
        raise HTTPException(status_code=403, detail="Forbidden")

    if user.role == "COMPANY_ADMIN" and user.company_id is None:
        raise HTTPException(status_code=403, detail="Company admin must belong to a company")

    return user


def ensure_company_scope(user: User, company_id: int) -> None:
    """
    Enforce tenant scope:
    - COMPANY_ADMIN: must match their company_id
    - SYSADMIN tunneled: must match tunneled company_id
    - SYSADMIN global (company_id is None): allowed for any company_id
    """
    if user.role == "COMPANY_ADMIN":
        if user.company_id != company_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        return

    if user.role == "SYSADMIN":
        # If tunneled, enforce scope
        if user.company_id is not None and user.company_id != company_id:
            raise HTTPException(status_code=403, detail="SYSADMIN is tunneled into a different company")
        return

    raise HTTPException(status_code=403, detail="Forbidden")