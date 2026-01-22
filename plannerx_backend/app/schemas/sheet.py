# app/schemas/sheet.py
from pydantic import BaseModel
from typing import Any

class SheetCreate(BaseModel):
    sheet_key: str
    sheet_name: str
    description: str | None = None
    model_json: dict[str, Any] | None = None

class SheetUpdate(BaseModel):
    sheet_name: str | None = None
    description: str | None = None
    model_json: dict[str, Any] | None = None
    is_active: bool | None = None

class SheetOut(BaseModel):
    sheet_id: int
    company_id: int
    sheet_key: str
    sheet_name: str
    description: str | None
    model_json: dict[str, Any]
    is_active: bool