"""Cryptographic SigningKey ORM model for provenance verification."""

from datetime import datetime
import uuid
from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class SigningKey(Base):
    __tablename__ = "signing_keys"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    owner: Mapped[str] = mapped_column(String(100), nullable=False)
    public_key_pem: Mapped[str] = mapped_column(Text, nullable=False)
    algorithm: Mapped[str] = mapped_column(String(50), default="Ed25519")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
