from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user, require_company_admin_or_sysadmin
from app.core.security import hash_password
from app.models.company import Company
from app.models.user import User
from app.schemas.user import UserCreate, UserOut

router = APIRouter(prefix="/admin", tags=["admin-users"])

@router.get("/companies/{company_id}/users", response_model=list[UserOut])
def list_users(company_id: int, db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    # SYSADMIN can view any company; COMPANY_ADMIN only their company
    if me.role != "SYSADMIN" and me.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    return db.query(User).filter(User.company_id == company_id).order_by(User.user_id.desc()).all()

@router.post("/companies/{company_id}/users", response_model=UserOut)
def create_user(company_id: int, req: UserCreate, db: Session = Depends(get_db), me: User = Depends(require_company_admin_or_sysadmin)):
    # COMPANY_ADMIN can only create within their company
    if me.role != "SYSADMIN" and me.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    company = db.query(Company).filter(Company.company_id == company_id, Company.is_active == True).first()
    if not company or not company.domain:
        raise HTTPException(status_code=404, detail="Company not found or missing domain")

    username = req.username.strip().lower()
    email = f"{username}@{company.domain.strip().lower()}"

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="User already exists")

    u = User(
        email=email,
        display_name=req.displayName,
        role=req.role,
        company_id=company_id,
        password_hash=hash_password(req.tempPassword),
        force_password_change=req.forcePasswordChange,
        is_active=True,
        permissions=req.permissions,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u