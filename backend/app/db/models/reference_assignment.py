"""Reference assignment ORM model."""

from datetime import datetime
import uuid
from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class ReferenceAssignment(Base):
    __tablename__ = "reference_assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id: Mapped[str] = mapped_column(String(36), ForeignKey("assessments.id"), nullable=False)
    asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("assets.id"), nullable=False)
    reference_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("references.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="assigned")
    assigned_by: Mapped[str] = mapped_column(String(100), default="Analyst")
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="reference_assignments")
    asset: Mapped["Asset"] = relationship("Asset", back_populates="reference_assignment")
    reference: Mapped["Reference | None"] = relationship("Reference", back_populates="assignments")
