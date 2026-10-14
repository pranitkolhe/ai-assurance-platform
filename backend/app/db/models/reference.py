"""Reference standard repository ORM model."""

from datetime import datetime
import uuid
from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Reference(Base):
    __tablename__ = "references"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="dataset")
    status: Mapped[str] = mapped_column(String(50), default="active")
    task: Mapped[str] = mapped_column(String(100), default="Object Detection")
    format: Mapped[str] = mapped_column(String(50), default="COCO")
    description: Mapped[str] = mapped_column(Text, default="")
    compatibility_json: Mapped[str] = mapped_column(Text, default="{}")
    source: Mapped[str] = mapped_column(String(200), default="Internal Benchmark")
    registered_by: Mapped[str] = mapped_column(String(100), default="System")
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    metadata_json: Mapped[str] = mapped_column(Text, default="{}")

    assignments: Mapped[list["ReferenceAssignment"]] = relationship("ReferenceAssignment", back_populates="reference")
