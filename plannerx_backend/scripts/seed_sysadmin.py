from passlib.context import CryptContext
import psycopg2

DATABASE_URL = "postgresql://localhost:5432/plannerx"

SYSADMIN_EMAIL = "sysadmin@plannerx.com"
SYSADMIN_PASSWORD = "PlannerX@123"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def main():
    password_hash = pwd_context.hash(SYSADMIN_PASSWORD)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO users (
            email,
            display_name,
            role,
            company_id,
            password_hash,
            permissions,
            force_password_change,
            is_active
        )
        VALUES (%s, %s, %s, NULL, %s, %s, %s, %s)
        ON CONFLICT (email) DO NOTHING
        """,
        (
            SYSADMIN_EMAIL,
            "System Admin",
            "SYSADMIN",
            password_hash,
            "{}",   # permissions (unused for SYSADMIN)
            False,  # force_password_change
            True
        )
    )

    conn.commit()
    cur.close()
    conn.close()

    print("✅ SYSADMIN user created (or already exists)")


if __name__ == "__main__":
    main()