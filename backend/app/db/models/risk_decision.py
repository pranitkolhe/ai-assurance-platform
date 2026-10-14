"""RiskDecision ORM model."""

from datetime import datetime
import uuid
from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class RiskDecision(Base):
    __tablename__ = "risk_decisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id: Mapped[str] = mapped_column(String(36), ForeignKey("assessments.id"), unique=True, nullable=False)
    disposition: Mapped[str] = mapped_column(String(50), default="review")  # accept, review, quarantine
    decided_by: Mapped[str] = mapped_column(String(100), nullable=False)
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="risk_decision")
