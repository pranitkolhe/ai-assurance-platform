"""Model artifact specific ORM model."""

import uuid
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class ModelArtifact(Base):
    __tablename__ = "model_artifacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("assets.id"), nullable=False)
    framework: Mapped[str] = mapped_column(String(50))  # ONNX, PyTorch, TorchScript
    input_shape: Mapped[str | None] = mapped_column(String(100), nullable=True)
    backbone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    metadata_json: Mapped[str] = mapped_column(Text, default="{}")
