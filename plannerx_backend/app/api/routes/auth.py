from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, create_access_token, hash_password
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(sub=user.email, extra={"role": user.role, "company_id": user.company_id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": int(user.id),
            "email": user.email,
            "displayName": user.display_name,
            "role": user.role,
            "companyId": user.company_id,
            "forcePasswordChange": bool(user.force_password_change),
            "permissions": user.permissions or {},
        },
    }

@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {
        "id": int(user.id),
        "email": user.email,
        "displayName": user.display_name,
        "role": user.role,
        "companyId": user.company_id,
        "forcePasswordChange": bool(user.force_password_change),
        "permissions": user.permissions or {},
    }

@router.post("/change-password")
def change_password(
    new_password: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.password_hash = hash_password(new_password)
    user.force_password_change = False
    db.add(user)
    db.commit()
    return {"ok": True}