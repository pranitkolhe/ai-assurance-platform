"""Model inspection and integrity schemas."""

from pydantic import BaseModel, ConfigDict
from app.core.enums import ModelFormat


class ModelInspectionResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    asset_id: str
    format: ModelFormat
    backbone: str | None = None
    input_shape: list[int] | None = None
    num_classes: int | None = None
    tamper_detected: bool = False
    clean_accuracy: float = 0.0
    backdoor_risk: str = "low"
