"""Asset ORM model."""

from datetime import datetime
import uuid
from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id: Mapped[str] = mapped_column(String(36), ForeignKey("assessments.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # dataset, model, inference
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    format: Mapped[str] = mapped_column(String(50), nullable=False)
    size: Mapped[str] = mapped_column(String(50), default="0 MB")
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="submitted")
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="assets")
    findings: Mapped[list["Finding"]] = relationship("Finding", back_populates="asset", cascade="all, delete-orphan")
    flagged_images: Mapped[list["FlaggedImage"]] = relationship("FlaggedImage", back_populates="asset", cascade="all, delete-orphan")
    reference_assignment: Mapped["ReferenceAssignment | None"] = relationship("ReferenceAssignment", back_populates="asset", uselist=False, cascade="all, delete-orphan")
