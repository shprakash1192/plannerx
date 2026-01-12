from pydantic import BaseModel

class UserCreateForCompany(BaseModel):
    username: str
    display_name: str
    role: str  # COMPANY_ADMIN / CEO / CFO / KAM
    temp_password: str
    force_password_change: bool = True
    permissions: dict = {}

class UserOut(BaseModel):
    id: int
    email: str
    display_name: str
    role: str
    company_id: int | None
    force_password_change: bool
    is_active: bool
    permissions: dict