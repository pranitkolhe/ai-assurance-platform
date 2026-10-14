"""Statistical distribution reference profile model."""

from datetime import datetime
import uuid
from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class ReferenceProfile(Base):
    __tablename__ = "reference_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task: Mapped[str] = mapped_column(String(100), nullable=False)
    class_name: Mapped[str] = mapped_column(String(100), nullable=False)
    embedding_mean_json: Mapped[str] = mapped_column(Text, default="[]")
    embedding_cov_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
