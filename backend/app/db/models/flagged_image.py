"""FlaggedImage ORM model."""

from datetime import datetime
import uuid
from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class FlaggedImage(Base):
    __tablename__ = "flagged_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id: Mapped[str] = mapped_column(String(36), ForeignKey("assessments.id"), nullable=False)
    asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("assets.id"), nullable=False)
    finding_id: Mapped[str] = mapped_column(String(36), ForeignKey("findings.id"), nullable=False)
    domain: Mapped[str] = mapped_column(String(100), default="data_integrity")
    image_name: Mapped[str] = mapped_column(String(255), nullable=False)
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    finding_title: Mapped[str] = mapped_column(String(255), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    severity: Mapped[str] = mapped_column(String(50), default="medium")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    detection_method: Mapped[str] = mapped_column(String(150), default="Engine")
    status: Mapped[str] = mapped_column(String(50), default="open")
    expected_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    observed_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="flagged_images")
    asset: Mapped["Asset"] = relationship("Asset", back_populates="flagged_images")
    finding: Mapped["Finding"] = relationship("Finding", back_populates="flagged_images")
