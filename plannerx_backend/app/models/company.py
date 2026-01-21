# app/models/company.py
from sqlalchemy import Column, Integer, String, Boolean
from app.db.session import Base

class Company(Base):
    __tablename__ = "companies"

    company_id = Column(Integer, primary_key=True, index=True)
    company_code = Column(String(50), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False)

    address1 = Column(String(255))
    address2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(50))
    zip = Column(String(20))

    domain = Column(String(255), unique=True)
    industry = Column(String(100))

    is_active = Column(Boolean, nullable=False, default=True)