# app/api/routes/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import json

from app.api.deps import get_db
from app.api.deps_auth import require_company_admin_or_sysadmin, ensure_company_scope
from app.core.security import hash_password
from app.schemas.user import UserCreateForCompany, UserOut
from app.models.user import User

router = APIRouter(prefix="/companies", tags=["users"])


@router.get("/{company_id}/users", response_model=list[UserOut])
def list_company_users(
    company_id: int,
    user: User = Depends(require_company_admin_or_sysadmin),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)

    rows = db.execute(
        text("""
            SELECT
              id,
              email,
              display_name,
              role,
              company_id,
              force_password_change,
              is_active,
              permissions
            FROM users
            WHERE company_id = :cid
            ORDER BY id DESC
        """),
        {"cid": company_id},
    ).mappings().all()

    return [dict(r) for r in rows]


@router.post("/{company_id}/users", response_model=UserOut)
def create_user_for_company(
    company_id: int,
    payload: UserCreateForCompany,
    user: User = Depends(require_company_admin_or_sysadmin),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)

    # Validate company + domain
    c = db.execute(
        text("""
            SELECT domain
            FROM companies
            WHERE company_id = :cid
              AND is_active = true
        """),
        {"cid": company_id},
    ).mappings().first()

    if not c:
        raise HTTPException(status_code=404, detail="Company not found")

    domain = (c["domain"] or "").strip().lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Company domain is missing")

    # Build email
    username = (payload.username or "").strip().lower()
    if not username:
        raise HTTPException(status_code=400, detail="username required")

    email = f"{username}@{domain}"

    # Validate role (don’t allow SYSADMIN creation here)
    if payload.role not in ("COMPANY_ADMIN", "CEO", "CFO", "KAM"):
        raise HTTPException(status_code=400, detail="invalid role")

    # Hash password
    password_hash = hash_password(payload.temp_password)

    # Insert user
    row = db.execute(
        text("""
            INSERT INTO users (
              email,
              display_name,
              role,
              company_id,
              password_hash,
              permissions,
              force_password_change,
              is_active
            )
            VALUES (
              :email,
              :display_name,
              :role,
              :company_id,
              :password_hash,
              CAST(:permissions AS jsonb),
              :force_password_change,
              true
            )
            RETURNING
              id,
              email,
              display_name,
              role,
              company_id,
              force_password_change,
              is_active,
              permissions;
        """),
        {
            "email": email,
            "display_name": payload.display_name,
            "role": payload.role,
            "company_id": company_id,
            "password_hash": password_hash,
            "permissions": json.dumps(payload.permissions or {}),
            "force_password_change": payload.force_password_change,
        },
    ).mappings().one()

    db.commit()
    return dict(row)