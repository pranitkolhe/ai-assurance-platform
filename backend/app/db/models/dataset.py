"""Dataset artifact specific ORM metadata model."""

import uuid
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class DatasetArtifact(Base):
    __tablename__ = "dataset_artifacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("assets.id"), nullable=False)
    format_type: Mapped[str] = mapped_column(String(50))  # COCO, YOLO
    total_images: Mapped[int] = mapped_column(Integer, default=0)
    total_annotations: Mapped[int] = mapped_column(Integer, default=0)
    classes_json: Mapped[str] = mapped_column(Text, default="[]")
