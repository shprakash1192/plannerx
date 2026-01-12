from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api.deps import get_db
from app.api.deps_auth import require_sysadmin
from app.schemas.company import CompanyCreate, CompanyOut
from app.models.user import User

router = APIRouter(prefix="/companies", tags=["companies"])

@router.get("", response_model=list[CompanyOut])
def list_companies(_: User = Depends(require_sysadmin), db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT company_id, name, address1, address2, city, state, zip, domain, industry, is_active
        FROM companies
        ORDER BY company_id DESC
    """)).mappings().all()
    return [dict(r) for r in rows]

@router.post("", response_model=CompanyOut)
def create_company(payload: CompanyCreate, _: User = Depends(require_sysadmin), db: Session = Depends(get_db)):
    row = db.execute(text("""
        INSERT INTO companies (name, address1, address2, city, state, zip, domain, industry, is_active)
        VALUES (:name, :address1, :address2, :city, :state, :zip, lower(:domain), :industry, true)
        RETURNING company_id, name, address1, address2, city, state, zip, domain, industry, is_active;
    """), payload.model_dump()).mappings().one()
    db.commit()
    return dict(row)