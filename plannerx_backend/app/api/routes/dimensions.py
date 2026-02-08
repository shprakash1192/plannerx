from __future__ import annotations

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api.deps import get_db
from app.api.deps_auth import get_current_user, ensure_company_scope
from app.models.user import User
from app.schemas.dimensions import (
    DimensionOutDTO,
    DimensionCreateDTO,
    DimensionUpdateDTO,
    DimensionValueOutDTO,
    DimensionValueCreateDTO,
    DimensionValueUpdateDTO,
)

router = APIRouter(prefix="/companies", tags=["dimensions"])

def _assert_admin(user: User) -> None:
    if user.role not in ("SYSADMIN", "COMPANY_ADMIN"):
        raise HTTPException(status_code=403, detail="Only SYSADMIN / COMPANY_ADMIN can modify dimensions")


def _assert_company_active(db: Session, company_id: int) -> None:
    r = (
        db.execute(
            text("SELECT is_active FROM companies WHERE company_id = :cid"),
            {"cid": company_id},
        )
        .mappings()
        .first()
    )
    if not r:
        raise HTTPException(status_code=404, detail="Company not found")
    if not bool(r["is_active"]):
        raise HTTPException(status_code=400, detail="Company is inactive. Upload calendar to activate.")


# ---------------- Dimensions ----------------

@router.get("/{company_id}/dimensions", response_model=list[DimensionOutDTO])
def list_dimensions(
    company_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)

    rows = (
        db.execute(
            text(
                """
                SELECT
                  dimension_id, company_id, dimension_key, dimension_name,
                  description, data_type, is_active
                FROM dimensions
                WHERE company_id = :cid
                ORDER BY dimension_id DESC
                """
            ),
            {"cid": company_id},
        )
        .mappings()
        .all()
    )

    return [dict(r) for r in rows]


@router.post("/{company_id}/dimensions", response_model=DimensionOutDTO)
def create_dimension(
    company_id: int,
    payload: DimensionCreateDTO,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)
    _assert_admin(user)
    _assert_company_active(db, company_id)

    key = (payload.dimension_key or "").strip().lower().replace(" ", "_")
    name = (payload.dimension_name or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="dimension_key required")
    if not name:
        raise HTTPException(status_code=400, detail="dimension_name required")

    dtype = (payload.data_type or "TEXT").strip().upper()
    if dtype not in ("TEXT", "NUMBER", "DATE"):
        raise HTTPException(status_code=400, detail="data_type must be TEXT, NUMBER, or DATE")

    try:
        row = (
            db.execute(
                text(
                    """
                    INSERT INTO dimensions (
                      company_id, dimension_key, dimension_name, description, data_type, is_active
                    )
                    VALUES (
                      :cid, :key, :name, :desc, :dtype, true
                    )
                    RETURNING
                      dimension_id, company_id, dimension_key, dimension_name, description, data_type, is_active
                    """
                ),
                {
                    "cid": company_id,
                    "key": key,
                    "name": name,
                    "desc": payload.description,
                    "dtype": dtype,
                },
            )
            .mappings()
            .one()
        )

        db.commit()
        return dict(row)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create dimension: {str(e)}")


@router.patch("/{company_id}/dimensions/{dimension_id}", response_model=DimensionOutDTO)
def update_dimension(
    company_id: int,
    dimension_id: int,
    payload: DimensionUpdateDTO,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)
    _assert_admin(user)
    _assert_company_active(db, company_id)

    # (Optional) keep your exists check, or fetch full row instead
    exists = (
        db.execute(
            text("""
                SELECT 1
                FROM dimensions
                WHERE company_id = :cid AND dimension_id = :did
            """),
            {"cid": company_id, "did": dimension_id},
        )
        .mappings()
        .first()
    )
    if not exists:
        raise HTTPException(status_code=404, detail="Dimension not found")

    # ✅ Ignore payload.data_type completely (datatype is locked after create)

    row = (
        db.execute(
            text("""
                UPDATE dimensions
                SET
                  dimension_name = COALESCE(:name, dimension_name),
                  description    = COALESCE(:desc, description),
                  is_active      = COALESCE(:is_active, is_active),
                  updated_at     = now()
                WHERE company_id = :cid AND dimension_id = :did
                RETURNING
                  dimension_id, company_id, dimension_key, dimension_name, description, data_type, is_active
            """),
            {
                "cid": company_id,
                "did": dimension_id,
                "name": payload.dimension_name,
                "desc": payload.description,
                "is_active": payload.is_active,
            },
        )
        .mappings()
        .one()
    )

    db.commit()
    return dict(row)


# ---------------- Dimension Values ----------------

@router.get("/{company_id}/dimensions/{dimension_id}/values", response_model=list[DimensionValueOutDTO])
def list_dimension_values(
    company_id: int,
    dimension_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)

    rows = (
        db.execute(
            text(
                """
                SELECT
                  dimension_value_id, company_id, dimension_id,
                  value_key, value_name, parent_value_id,
                  sort_order, attributes_json, is_active
                FROM dimension_values
                WHERE company_id = :cid AND dimension_id = :did
                ORDER BY COALESCE(sort_order, 999999), value_name
                """
            ),
            {"cid": company_id, "did": dimension_id},
        )
        .mappings()
        .all()
    )

    return [dict(r) for r in rows]


@router.post("/{company_id}/dimensions/{dimension_id}/values", response_model=DimensionValueOutDTO)
def create_dimension_value(
    company_id: int,
    dimension_id: int,
    payload: DimensionValueCreateDTO,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)
    _assert_admin(user)
    _assert_company_active(db, company_id)

    d = (
        db.execute(
            text(
                """
                SELECT 1
                FROM dimensions
                WHERE company_id = :cid AND dimension_id = :did
                """
            ),
            {"cid": company_id, "did": dimension_id},
        )
        .mappings()
        .first()
    )
    if not d:
        raise HTTPException(status_code=404, detail="Dimension not found")

    key = (payload.value_key or "").strip().lower().replace(" ", "_")
    name = (payload.value_name or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="value_key required")
    if not name:
        raise HTTPException(status_code=400, detail="value_name required")

    # Validate parent (optional)
    parent_id = payload.parent_value_id
    if parent_id is not None:
        p = (
            db.execute(
                text(
                    """
                    SELECT 1
                    FROM dimension_values
                    WHERE company_id = :cid AND dimension_id = :did AND dimension_value_id = :pid
                    """
                ),
                {"cid": company_id, "did": dimension_id, "pid": parent_id},
            )
            .mappings()
            .first()
        )
        if not p:
            raise HTTPException(status_code=400, detail="parent_value_id not found in this dimension")

    attrs = payload.attributes_json or {}

    try:
        row = (
            db.execute(
                text(
                    """
                    INSERT INTO dimension_values (
                      company_id, dimension_id,
                      value_key, value_name, parent_value_id,
                      sort_order, attributes_json, is_active
                    )
                    VALUES (
                      :cid, :did,
                      :key, :name, :parent_id,
                      :sort_order, CAST(:attrs AS jsonb), true
                    )
                    RETURNING
                      dimension_value_id, company_id, dimension_id,
                      value_key, value_name, parent_value_id,
                      sort_order, attributes_json, is_active
                    """
                ),
                {
                    "cid": company_id,
                    "did": dimension_id,
                    "key": key,
                    "name": name,
                    "parent_id": parent_id,
                    "sort_order": payload.sort_order,
                    "attrs": json.dumps(attrs),
                },
            )
            .mappings()
            .one()
        )

        db.commit()
        return dict(row)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create dimension value: {str(e)}")


@router.patch(
    "/{company_id}/dimensions/{dimension_id}/values/{dimension_value_id}",
    response_model=DimensionValueOutDTO,
)
def update_dimension_value(
    company_id: int,
    dimension_id: int,
    dimension_value_id: int,
    payload: DimensionValueUpdateDTO,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_company_scope(user, company_id)
    _assert_admin(user)
    _assert_company_active(db, company_id)

    existing = (
        db.execute(
            text(
                """
                SELECT 1
                FROM dimension_values
                WHERE company_id = :cid AND dimension_id = :did AND dimension_value_id = :vid
                """
            ),
            {"cid": company_id, "did": dimension_id, "vid": dimension_value_id},
        )
        .mappings()
        .first()
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Dimension value not found")

    # parent validation (optional)
    parent_id = payload.parent_value_id
    if parent_id is not None:
        p = (
            db.execute(
                text(
                    """
                    SELECT 1
                    FROM dimension_values
                    WHERE company_id = :cid AND dimension_id = :did AND dimension_value_id = :pid
                    """
                ),
                {"cid": company_id, "did": dimension_id, "pid": parent_id},
            )
            .mappings()
            .first()
        )
        if not p:
            raise HTTPException(status_code=400, detail="parent_value_id not found in this dimension")

    row = (
        db.execute(
            text(
                """
                UPDATE dimension_values
                SET
                  value_name = COALESCE(:name, value_name),
                  parent_value_id = COALESCE(:parent_id, parent_value_id),
                  sort_order = COALESCE(:sort_order, sort_order),
                  attributes_json = CASE
                    WHEN :attrs IS NULL THEN attributes_json
                    ELSE CAST(:attrs AS jsonb)
                  END,
                  is_active  = COALESCE(:is_active, is_active),
                  updated_at = now()
                WHERE company_id = :cid AND dimension_id = :did AND dimension_value_id = :vid
                RETURNING
                  dimension_value_id, company_id, dimension_id,
                  value_key, value_name, parent_value_id,
                  sort_order, attributes_json, is_active
                """
            ),
            {
                "cid": company_id,
                "did": dimension_id,
                "vid": dimension_value_id,
                "name": payload.value_name,
                "parent_id": payload.parent_value_id,
                "sort_order": payload.sort_order,
                "attrs": None if payload.attributes_json is None else json.dumps(payload.attributes_json),
                "is_active": payload.is_active,
            },
        )
        .mappings()
        .one()
    )

    db.commit()
    return dict(row)