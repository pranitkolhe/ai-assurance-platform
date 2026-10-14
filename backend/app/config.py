"""Application configuration using pydantic-settings."""

from __future__ import annotations
from functools import lru_cache
from pathlib import Path
from typing import Any
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for AI Assurance Platform."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "AI Assurance Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v: Any) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on", "debug")
        return False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://pranitkolhe@localhost:5432/assurance_dev"

    # Security
    SECRET_KEY: str = "super-secret-key-change-in-production-cv-assurance"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    # Storage Dirs
    UPLOAD_DIR: Path = Path("data/uploads")
    MODEL_DIR: Path = Path("data/models")
    REPORT_DIR: Path = Path("data/reports")
    REFERENCE_DIR: Path = Path("data/reference")
    EMBEDDING_DIR: Path = Path("data/embeddings")
    QUARANTINE_DIR: Path = Path("data/quarantine")

    # Networking & Uploads
    CORS_ORIGINS: list[str] = Field(default=["http://localhost:5173", "http://127.0.0.1:5173"])
    MAX_UPLOAD_SIZE_BYTES: int = 20 * 1024 * 1024 * 1024  # 20 GB

    @property
    def data_dirs(self) -> list[Path]:
        return [
            self.UPLOAD_DIR,
            self.MODEL_DIR,
            self.REPORT_DIR,
            self.REFERENCE_DIR,
            self.EMBEDDING_DIR,
            self.QUARANTINE_DIR,
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()

settings: Settings = get_settings()
