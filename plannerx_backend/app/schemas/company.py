from pydantic import BaseModel

class CompanyCreate(BaseModel):
    name: str
    address1: str
    address2: str | None = None
    city: str
    state: str
    zip: str
    domain: str
    industry: str

class CompanyOut(BaseModel):
    company_id: int
    name: str
    address1: str
    address2: str | None
    city: str
    state: str
    zip: str
    domain: str
    industry: str
    is_active: bool