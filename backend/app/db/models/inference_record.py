"""InferenceRecord ORM model."""

from datetime import datetime
import uuid
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class InferenceRecord(Base):
    __tablename__ = "inference_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id: Mapped[str] = mapped_column(String(36), ForeignKey("assessments.id"), nullable=False)
    image_id: Mapped[str] = mapped_column(String(100), nullable=False)
    image_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    model_id: Mapped[str] = mapped_column(String(100), nullable=False)
    model_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    preprocessing_hash: Mapped[str] = mapped_column(String(64), default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    sequence: Mapped[int] = mapped_column(Integer, default=0)
    nonce: Mapped[str] = mapped_column(String(64), default="")
    signature_valid: Mapped[bool] = mapped_column(Boolean, default=True)
    replay_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    output_tampered: Mapped[bool] = mapped_column(Boolean, default=False)

    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="inferences")
