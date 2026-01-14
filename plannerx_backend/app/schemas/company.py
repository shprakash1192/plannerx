from pydantic import BaseModel

class CompanyCreate(BaseModel):
    company_code: str
    company_name: str
    address1: str | None = None
    address2: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    domain: str | None = None
    industry: str | None = None

class CompanyUpdate(BaseModel):
    # company_code is immutable from settings page
    company_name: str | None = None
    address1: str | None = None
    address2: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    domain: str | None = None
    industry: str | None = None

class CompanyOut(BaseModel):
    company_id: int
    company_code: str
    company_name: str
    address1: str | None
    address2: str | None
    city: str | None
    state: str | None
    zip: str | None
    domain: str | None
    industry: str | None
    is_active: bool