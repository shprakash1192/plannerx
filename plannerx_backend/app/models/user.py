from sqlalchemy import BigInteger, Boolean, CheckConstraint, Column, ForeignKey, JSON, Text, TIMESTAMP
from sqlalchemy.sql import func
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)
    email = Column(Text, nullable=False, unique=True)
    display_name = Column(Text, nullable=False)

    role = Column(Text, nullable=False)
    __table_args__ = (
        CheckConstraint("role IN ('SYSADMIN','COMPANY_ADMIN','CEO','CFO','KAM')", name="ck_user_role"),
    )

    company_id = Column(BigInteger, ForeignKey("companies.company_id", ondelete="CASCADE"), nullable=True)

    password_hash = Column(Text, nullable=False)
    permissions = Column(JSON, nullable=False, server_default="{}")
    force_password_change = Column(Boolean, nullable=False, server_default="true")
    is_active = Column(Boolean, nullable=False, server_default="true")

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)