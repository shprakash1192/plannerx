# app/db/base.py
from app.db.session import Base  # noqa: F401

# Import all models here so they are registered on Base.metadata
from app.models.company import Company  # noqa: F401
from app.models.user import User        # noqa: F401