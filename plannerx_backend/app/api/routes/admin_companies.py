from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_sysadmin
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyOut

router = APIRouter(prefix="/admin/companies", tags=["admin-companies"])

@router.get("", response_model=list[CompanyOut])
def list_companies(db: Session = Depends(get_db), _: object = Depends(require_sysadmin)):
    return db.query(Company).order_by(Company.company_id.desc()).all()

@router.post("", response_model=CompanyOut)
def create_company(req: CompanyCreate, db: Session = Depends(get_db), _: object = Depends(require_sysadmin)):
    domain = req.domain.strip().lower()
    if db.query(Company).filter(Company.domain == domain).first():
        raise HTTPException(status_code=409, detail="Domain already exists")

    c = Company(
      company_name=req.company_name,
      address1=req.address1,
      address2=req.address2,
      city=req.city,
      state=req.state,
      zip=req.zip,
      domain=domain,
      industry=req.industry,
      is_active=True
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c