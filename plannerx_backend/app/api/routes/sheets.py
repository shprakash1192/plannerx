# app/api/routes/sheets.py
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api.deps import get_db
from app.api.deps_auth import require_company_admin_or_sysadmin, ensure_company_scope
from app.models.user import User
from app.schemas.sheet import SheetCreate, SheetUpdate, SheetOut

router = APIRouter(prefix="/companies", tags=["sheets"])


def _get_company_calendar_sheet_id(db: Session, company_id: int) -> int | None:
    r = db.execute(
        text("SELECT calendar_sheet_id FROM companies WHERE company_id = :cid LIMIT 1"),
        {"cid": company_id},
    ).mappings().first()
    return r["calendar_sheet_id"] if r else None


def _assert_can_modify_calendar(user: User) -> None:
    if user.role not in ("SYSADMIN", "COMPANY_ADMIN"):
        raise HTTPException(
            status_code=403,
            detail="Calendar can only be modified by SYSADMIN or COMPANY_ADMIN",
        )


def _normalize_sheet_key(raw: str) -> str:
    return (raw or "").strip().lower().replace(" ", "_")


def _is_calendar_key(key: str) -> bool:
    # keep it strict; only allow exact "calendar"
    return key == "calendar"


@router.get("/{company_id}/sheets", response_model=list[SheetOut])
def list_sheets(
    company_id: int,
    user: User = Depends(require_company_admin_or_sysadmin),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)

    rows = db.execute(
        text("""
            SELECT
              sheet_id,
              company_id,
              sheet_key,
              sheet_name,
              description,
              model_json,
              is_active
            FROM sheets
            WHERE company_id = :cid
            ORDER BY sheet_id DESC
        """),
        {"cid": company_id},
    ).mappings().all()

    return [dict(r) for r in rows]


@router.post("/{company_id}/sheets", response_model=SheetOut)
def create_sheet(
    company_id: int,
    payload: SheetCreate,
    user: User = Depends(require_company_admin_or_sysadmin),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)

    key = _normalize_sheet_key(payload.sheet_key)
    name = (payload.sheet_name or "").strip()

    if not key:
        raise HTTPException(status_code=400, detail="sheet_key required")
    if not name:
        raise HTTPException(status_code=400, detail="sheet_name required")

    # ✅ Step 7: only SYSADMIN / COMPANY_ADMIN can create Calendar sheet
    if _is_calendar_key(key):
        _assert_can_modify_calendar(user)

    try:
        row = db.execute(
            text("""
                INSERT INTO sheets (
                  company_id, sheet_key, sheet_name, description, model_json, is_active
                )
                VALUES (
                  :cid, :key, :name, :desc, CAST(:model_json AS jsonb), true
                )
                RETURNING
                  sheet_id, company_id, sheet_key, sheet_name, description,
                  model_json, is_active;
            """),
            {
                "cid": company_id,
                "key": key,
                "name": name,
                "desc": payload.description,
                "model_json": json.dumps(payload.model_json or {}),
            },
        ).mappings().one()

        # ✅ Step 8: if this is Calendar, auto-tag it on company (optional but recommended)
        if _is_calendar_key(key):
            db.execute(
                text("""
                    UPDATE companies
                    SET calendar_sheet_id = :sid
                    WHERE company_id = :cid
                """),
                {"sid": row["sheet_id"], "cid": company_id},
            )

        db.commit()
        return dict(row)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create sheet: {str(e)}")


@router.patch("/{company_id}/sheets/{sheet_id}", response_model=SheetOut)
def update_sheet(
    company_id: int,
    sheet_id: int,
    payload: SheetUpdate,
    user: User = Depends(require_company_admin_or_sysadmin),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)

    existing = db.execute(
        text("""
            SELECT
              sheet_id, company_id, sheet_key, sheet_name,
              description, model_json, is_active
            FROM sheets
            WHERE company_id = :cid AND sheet_id = :sid
            LIMIT 1
        """),
        {"cid": company_id, "sid": sheet_id},
    ).mappings().first()

    if not existing:
        raise HTTPException(status_code=404, detail="Sheet not found")

    # ✅ Step 7: protect Calendar modifications
    calendar_sheet_id = _get_company_calendar_sheet_id(db, company_id)
    is_calendar_by_id = (calendar_sheet_id is not None and sheet_id == calendar_sheet_id)
    is_calendar_by_key = _is_calendar_key(existing["sheet_key"])

    if is_calendar_by_id or is_calendar_by_key:
        _assert_can_modify_calendar(user)

    row = db.execute(
        text("""
            UPDATE sheets
            SET
              sheet_name   = COALESCE(:sheet_name, sheet_name),
              description  = COALESCE(:description, description),
              model_json   = CASE
                WHEN :model_json IS NULL THEN model_json
                ELSE CAST(:model_json AS jsonb)
              END,
              is_active    = COALESCE(:is_active, is_active)
            WHERE company_id = :cid AND sheet_id = :sid
            RETURNING
              sheet_id, company_id, sheet_key, sheet_name, description, model_json, is_active;
        """),
        {
            "cid": company_id,
            "sid": sheet_id,
            "sheet_name": payload.sheet_name,
            "description": payload.description,
            "model_json": None if payload.model_json is None else json.dumps(payload.model_json),
            "is_active": payload.is_active,
        },
    ).mappings().one()

    db.commit()
    return dict(row)