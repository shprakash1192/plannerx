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
              is_active,
              calendar_sheet_id
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
              is_active,
              calendar_sheet_id;
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
              is_active,
              calendar_sheet_id
            FROM companies
            WHERE company_id = :company_id
            LIMIT 1
        """),
        {"company_id": company_id},
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Company not found")

    return dict(row)


# -----------------------------
# STEP 6: Set calendar sheet
# -----------------------------
@router.post("/{company_id}/calendar-sheet", response_model=CompanyOut)
def set_calendar_sheet(
    company_id: int,
    sheet_id: int,
    user: User = Depends(require_company_admin_or_sysadmin),
    db: Session = Depends(get_db),
):
    # tenant guard
    ensure_company_scope(user, company_id)

    # Only SYSADMIN or COMPANY_ADMIN can set the calendar
    if user.role not in ("SYSADMIN", "COMPANY_ADMIN"):
        raise HTTPException(status_code=403, detail="Forbidden")

    # Validate company exists
    c = db.execute(
        text("""
            SELECT company_id
            FROM companies
            WHERE company_id = :cid
            LIMIT 1
        """),
        {"cid": company_id},
    ).mappings().first()

    if not c:
        raise HTTPException(status_code=404, detail="Company not found")

    # Validate sheet exists + belongs to company + active
    s = db.execute(
        text("""
            SELECT sheet_id
            FROM sheets
            WHERE sheet_id = :sid
              AND company_id = :cid
              AND is_active = true
            LIMIT 1
        """),
        {"sid": sheet_id, "cid": company_id},
    ).mappings().first()

    if not s:
        raise HTTPException(status_code=400, detail="Invalid sheet_id for this company")

    # Update company.calendar_sheet_id
    row = db.execute(
        text("""
            UPDATE companies
            SET calendar_sheet_id = :sid
            WHERE company_id = :cid
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
              is_active,
              calendar_sheet_id;
        """),
        {"cid": company_id, "sid": sheet_id},
    ).mappings().first()

    db.commit()
    return dict(row)


@router.patch("/{company_id}", response_model=CompanyOut)
def update_company(
    company_id: int,
    payload: CompanyUpdate,
    user: User = Depends(require_company_admin_or_sysadmin),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)

    # 0) Load current state (needed for activation guard + partial updates)
    current = db.execute(
        text("""
            SELECT
              company_id,
              is_active,
              calendar_sheet_id
            FROM companies
            WHERE company_id = :cid
            LIMIT 1
        """),
        {"cid": company_id},
    ).mappings().first()

    if not current:
        raise HTTPException(status_code=404, detail="Company not found")

    data = payload.model_dump(exclude_unset=True)

    # 1) Enforce calendar before activation
    # If caller is trying to flip is_active -> true, ensure calendar_sheet_id exists
    will_activate = (data.get("is_active") is True) and (current["is_active"] is False)

    calendar_after_update = (
        data["calendar_sheet_id"]
        if "calendar_sheet_id" in data
        else current["calendar_sheet_id"]
    )

    if will_activate and calendar_after_update is None:
        raise HTTPException(
            status_code=400,
            detail="Company cannot be activated without a calendar sheet",
        )

    # 2) Do the update
    row = db.execute(
        text("""
            UPDATE companies
            SET
              company_name       = COALESCE(:company_name, company_name),
              address1           = COALESCE(:address1, address1),
              address2           = COALESCE(:address2, address2),
              city               = COALESCE(:city, city),
              state              = COALESCE(:state, state),
              zip                = COALESCE(:zip, zip),
              domain             = COALESCE(lower(:domain), domain),
              industry           = COALESCE(:industry, industry),
              is_active          = COALESCE(:is_active, is_active),
              calendar_sheet_id  = COALESCE(:calendar_sheet_id, calendar_sheet_id)
            WHERE company_id = :company_id
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
              is_active,
              calendar_sheet_id;
        """),
        {**data, "company_id": company_id},
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Company not found")

    db.commit()
    return dict(row)