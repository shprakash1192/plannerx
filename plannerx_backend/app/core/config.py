from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_EXPIRE_MINUTES: int = 180

    SYSADMIN_EMAIL: str = "sysadmin@plannerx.com"
    SYSADMIN_PASSWORD: str = "PlannerX@123"


settings = Settings()