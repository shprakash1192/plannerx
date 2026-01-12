from sqlalchemy import Column, BigInteger, String, Boolean, TIMESTAMP
from sqlalchemy.sql import func
from app.db.base import Base

class Company(Base):
    __tablename__ = "companies"

    company_id = Column(BigInteger, primary_key=True, index=True)
    company_code = Column(String, nullable=True)  # optional if you have it
    company_name = Column(String, nullable=False)

    address1 = Column(String, nullable=True)
    address2 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    zip = Column(String, nullable=True)

    domain = Column(String, nullable=True, unique=True, index=True)
    industry = Column(String, nullable=True)

    is_active = Column(Boolean, nullable=False, server_default="true")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)