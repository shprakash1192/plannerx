# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    display_name = Column(String(255), nullable=False)

    role = Column(String(50), nullable=False)

    company_id = Column(
        Integer,
        ForeignKey("companies.company_id", ondelete="SET NULL"),
        nullable=True,
    )

    password_hash = Column(String(255), nullable=False)

    permissions = Column(JSONB, nullable=False, default=dict)

    force_password_change = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)