"""Report ORM model."""

from datetime import datetime
import uuid
from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id: Mapped[str] = mapped_column(String(36), ForeignKey("assessments.id"), unique=True, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    overall_risk: Mapped[str] = mapped_column(String(50), default="low")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    recommendation: Mapped[str] = mapped_column(String(50), default="accept")
    analyst_decision: Mapped[str | None] = mapped_column(String(50), nullable=True)
    report_file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="report")
