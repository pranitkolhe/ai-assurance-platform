"""Dataset integrity schemas."""

from pydantic import BaseModel, ConfigDict
from app.core.enums import DatasetFormat


class DatasetInspectionResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    asset_id: str
    format: DatasetFormat
    valid: bool
    total_images: int
    total_annotations: int
    duplicate_count: int = 0
    corrupt_samples_count: int = 0
    warnings: list[str] = []
