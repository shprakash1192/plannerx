# app/api/routes/companies.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api.deps import get_db
from app.api.deps_auth import (
    require_sysadmin_global,           # SYSADMIN + NOT tunneled
    require_company_admin_or_sysadmin, # SYSADMIN tunneled OR COMPANY_ADMIN
    ensure_company_scope,
)
from app.schemas.company import CompanyCreate, CompanyOut, CompanyUpdate
from app.models.user import User

router = APIRouter(prefix="/companies", tags=["companies"])


# -----------------------------
# SYSADMIN GLOBAL (NOT tunneled)
# -----------------------------
@router.get("", response_model=list[CompanyOut])
def list_companies(_: User = Depends(require_sysadmin_global), db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT
              company_id,
              company_code,
              company_name,
              address1,
              address2,
              city,
              state,
              zip,
              domain,
              industry,
              is_active
            FROM companies
            ORDER BY company_id DESC
        """)
    ).mappings().all()

    return [dict(r) for r in rows]


@router.post("", response_model=CompanyOut)
def create_company(
    payload: CompanyCreate,
    _: User = Depends(require_sysadmin_global),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()

    # keep NULL as NULL; only lowercase if domain is provided
    if data.get("domain"):
        data["domain"] = data["domain"].lower()

    row = db.execute(
        text("""
            INSERT INTO companies
              (company_code, company_name, address1, address2, city, state, zip, domain, industry, is_active)
            VALUES
              (:company_code, :company_name, :address1, :address2, :city, :state, :zip, :domain, :industry, true)
            RETURNING
              company_id,
              company_code,
              company_name,
              address1,
              address2,
              city,
              state,
              zip,
              domain,
              industry,
              is_active;
        """),
        data,
    ).mappings().one()

    db.commit()
    return dict(row)


# --------------------------------------------
# COMPANY SCOPED (SYSADMIN tunneled / COMPANY_ADMIN)
# --------------------------------------------
@router.get("/{company_id}", response_model=CompanyOut)
def get_company(
    company_id: int,
    user: User = Depends(require_company_admin_or_sysadmin),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)

    row = db.execute(
        text("""
            SELECT
              company_id,
              company_code,
              company_name,
              address1,
              address2,
              city,
              state,
              zip,
              domain,
              industry,
              is_active
            FROM companies
            WHERE company_id = :company_id
            LIMIT 1
        """),
        {"company_id": company_id},
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Company not found")

    return dict(row)


@router.patch("/{company_id}", response_model=CompanyOut)
def update_company(
    company_id: int,
    payload: CompanyUpdate,
    user: User = Depends(require_company_admin_or_sysadmin),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)

    data = payload.model_dump(exclude_unset=True)

    row = db.execute(text("""
        UPDATE companies
        SET
          company_name = COALESCE(:company_name, company_name),
          address1     = COALESCE(:address1, address1),
          address2     = COALESCE(:address2, address2),
          city         = COALESCE(:city, city),
          state        = COALESCE(:state, state),
          zip          = COALESCE(:zip, zip),
          domain       = COALESCE(lower(:domain), domain),
          industry     = COALESCE(:industry, industry)
        WHERE company_id = :company_id
        RETURNING company_id, company_code, company_name, address1, address2, city, state, zip, domain, industry, is_active;
    """), {**data, "company_id": company_id}).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Company not found")

    db.commit()
    return dict(row)