"""Assessment ORM model."""

from datetime import datetime
import uuid
from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    contributor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    use_case: Mapped[str] = mapped_column(String(200), default="Computer Vision Assurance")
    task: Mapped[str] = mapped_column(String(100), default="Object Detection")
    status: Mapped[str] = mapped_column(String(50), default="draft")
    overall_risk: Mapped[str | None] = mapped_column(String(50), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # Processing state
    processing_status: Mapped[str | None] = mapped_column(String(50), nullable=True, default="submitted")
    processing_progress: Mapped[float] = mapped_column(Float, default=0.0)
    processing_current_step: Mapped[str | None] = mapped_column(String(200), nullable=True, default="Ready")
    processing_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    processing_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    contributor: Mapped["User"] = relationship("User", back_populates="assessments")
    assets: Mapped[list["Asset"]] = relationship("Asset", back_populates="assessment", cascade="all, delete-orphan")
    findings: Mapped[list["Finding"]] = relationship("Finding", back_populates="assessment", cascade="all, delete-orphan")
    flagged_images: Mapped[list["FlaggedImage"]] = relationship("FlaggedImage", back_populates="assessment", cascade="all, delete-orphan")
    reference_assignments: Mapped[list["ReferenceAssignment"]] = relationship("ReferenceAssignment", back_populates="assessment", cascade="all, delete-orphan")
    risk_decision: Mapped["RiskDecision | None"] = relationship("RiskDecision", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    assurance_result: Mapped["AssuranceResult | None"] = relationship("AssuranceResult", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    report: Mapped["Report | None"] = relationship("Report", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    inferences: Mapped[list["InferenceRecord"]] = relationship("InferenceRecord", back_populates="assessment", cascade="all, delete-orphan")
