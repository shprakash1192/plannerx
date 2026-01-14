# scripts/reseed_sysadmin.py
from app.db import base  # noqa: F401  <-- IMPORTANT: registers Company + User

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User


def reseed_sysadmin():
    db: Session = SessionLocal()
    try:
        email = settings.SYSADMIN_EMAIL.strip().lower()

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            existing.display_name = "System Admin"
            existing.role = "SYSADMIN"
            existing.company_id = None
            existing.password_hash = hash_password(settings.SYSADMIN_PASSWORD)
            existing.force_password_change = False
            existing.is_active = True
        else:
            u = User(
                email=email,
                display_name="System Admin",
                role="SYSADMIN",
                company_id=None,
                password_hash=hash_password(settings.SYSADMIN_PASSWORD),
                permissions={},
                force_password_change=False,
                is_active=True,
            )
            db.add(u)

        db.commit()
        print("SYSADMIN reseeded:", email)
    finally:
        db.close()


if __name__ == "__main__":
    reseed_sysadmin()