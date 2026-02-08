from __future__ import annotations

from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, Field

DataType = Literal["TEXT", "NUMBER", "DATE"]

class DimensionOutDTO(BaseModel):
    dimension_id: int
    company_id: int
    dimension_key: str
    dimension_name: str
    description: Optional[str] = None
    data_type: DataType
    is_active: bool

    class Config:
        from_attributes = True


class DimensionCreateDTO(BaseModel):
    dimension_key: str = Field(min_length=1, max_length=80)
    dimension_name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    data_type: Optional[DataType] = "TEXT"


class DimensionUpdateDTO(BaseModel):
    dimension_name: Optional[str] = None
    description: Optional[str] = None
    data_type: Optional[DataType] = None
    is_active: Optional[bool] = None


class DimensionValueOutDTO(BaseModel):
    dimension_value_id: int
    company_id: int
    dimension_id: int
    value_key: str
    value_name: str
    parent_value_id: Optional[int] = None
    sort_order: Optional[int] = None
    attributes_json: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool

    class Config:
        from_attributes = True


class DimensionValueCreateDTO(BaseModel):
    value_key: str = Field(min_length=1, max_length=120)
    value_name: str = Field(min_length=1, max_length=200)
    parent_value_id: Optional[int] = None
    sort_order: Optional[int] = None
    attributes_json: Optional[Dict[str, Any]] = Field(default_factory=dict)


class DimensionValueUpdateDTO(BaseModel):
    value_name: Optional[str] = None
    parent_value_id: Optional[int] = None
    sort_order: Optional[int] = None
    attributes_json: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None