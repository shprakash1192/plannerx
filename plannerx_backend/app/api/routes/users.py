from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api.deps import get_db
from app.api.deps_auth import require_sysadmin
from app.core.security import hash_password
from app.schemas.user import UserCreateForCompany, UserOut
from app.models.user import User

router = APIRouter(prefix="/companies", tags=["users"])

@router.get("/{company_id}/users", response_model=list[UserOut])
def list_company_users(company_id: int, _: User = Depends(require_sysadmin), db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT id, email, display_name, role, company_id, force_password_change, is_active, permissions
        FROM users
        WHERE company_id = :cid
        ORDER BY id DESC
    """), {"cid": company_id}).mappings().all()
    return [dict(r) for r in rows]

@router.post("/{company_id}/users", response_model=UserOut)
def create_user_for_company(company_id: int, payload: UserCreateForCompany, _: User = Depends(require_sysadmin), db: Session = Depends(get_db)):
    c = db.execute(text("SELECT domain FROM companies WHERE company_id = :cid AND is_active = true"), {"cid": company_id}).mappings().first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")

    domain = (c["domain"] or "").lower()
    username = payload.username.strip().lower()
    if not username:
        raise HTTPException(status_code=400, detail="username required")
    email = f"{username}@{domain}"

    if payload.role not in ("COMPANY_ADMIN", "CEO", "CFO", "KAM"):
        raise HTTPException(status_code=400, detail="invalid role")

    ph = hash_password(payload.temp_password)

    row = db.execute(text("""
        INSERT INTO users (email, display_name, role, company_id, password_hash, permissions, force_password_change, is_active)
        VALUES (:email, :display_name, :role, :company_id, :password_hash, :permissions::jsonb, :force_password_change, true)
        RETURNING id, email, display_name, role, company_id, force_password_change, is_active, permissions;
    """), {
        "email": email,
        "display_name": payload.display_name,
        "role": payload.role,
        "company_id": company_id,
        "password_hash": ph,
        "permissions": payload.permissions,
        "force_password_change": payload.force_password_change,
    }).mappings().one()

    db.commit()
    return dict(row)