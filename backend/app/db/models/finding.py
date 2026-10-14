"""Finding ORM model."""

from datetime import datetime
import uuid
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id: Mapped[str] = mapped_column(String(36), ForeignKey("assessments.id"), nullable=False)
    asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("assets.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    severity: Mapped[str] = mapped_column(String(50), default="medium")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(50), default="open")
    affected_samples: Mapped[int] = mapped_column(Integer, default=0)
    detection_method: Mapped[str] = mapped_column(String(150), default="Automated")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="findings")
    asset: Mapped["Asset"] = relationship("Asset", back_populates="findings")
    evidence_items: Mapped[list["Evidence"]] = relationship("Evidence", back_populates="finding", cascade="all, delete-orphan")
    flagged_images: Mapped[list["FlaggedImage"]] = relationship("FlaggedImage", back_populates="finding", cascade="all, delete-orphan")
