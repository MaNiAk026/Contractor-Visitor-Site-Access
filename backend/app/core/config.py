"""Application configuration loaded exclusively from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the Renewi local platform."""

    app_env: str = "development"
    database_url: str = "postgresql+psycopg://renewi@postgres:5432/renewi_access"
    redis_url: str = "redis://redis:6379/0"
    storage_provider: str = "local"
    storage_local_path: str = "/var/lib/renewi/evidence"
    ocr_provider: str = "mock"
    identity_verifier_provider: str = "mock"
    notification_provider: str = "mock"
    auth_provider: str = "demo"
    token_signing_key: str | None = None
    log_level: str = "INFO"
    expiry_revalidation_interval_seconds: int = 60
    worker_retry_delay_seconds: int = 5
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(case_sensitive=False, extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        """Return configured browser origins as a normalized list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


# PUBLIC_INTERFACE
@lru_cache
def get_settings() -> Settings:
    """Return the cached environment-derived application settings."""
    return Settings()
