from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user, require_company_admin_or_sysadmin
from app.models.company import Company
from app.schemas.company import CompanyOut, CompanyCreate

router = APIRouter(prefix="/admin/company", tags=["company-settings"])

@router.get("", response_model=CompanyOut)
def get_company(db: Session = Depends(get_db), me=Depends(get_current_user)):
    if not me.company_id:
        raise HTTPException(status_code=400, detail="No active company context")
    c = db.query(Company).filter(Company.company_id == me.company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    return c

@router.put("", response_model=CompanyOut)
def update_company(req: CompanyCreate, db: Session = Depends(get_db), me=Depends(require_company_admin_or_sysadmin)):
    if not me.company_id:
        raise HTTPException(status_code=400, detail="No active company context")

    c = db.query(Company).filter(Company.company_id == me.company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")

    c.company_name = req.company_name
    c.address1 = req.address1
    c.address2 = req.address2
    c.city = req.city
    c.state = req.state
    c.zip = req.zip
    c.domain = req.domain.strip().lower()
    c.industry = req.industry
    db.add(c)
    db.commit()
    db.refresh(c)
    return c