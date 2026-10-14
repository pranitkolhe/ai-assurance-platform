"""Asset schemas matching frontend asset.model.ts."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, AliasChoices
from app.core.enums import AssetStatus, AssetType


class AssetBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    type: AssetType
    name: str
    format: str
    size: str = "0 MB"
    sha256: str


class AssetCreate(AssetBase):
    assessment_id: str = Field(
        ...,
        validation_alias=AliasChoices("assessmentId", "assessment_id"),
        serialization_alias="assessmentId",
    )


class AssetUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    name: str | None = None
    status: AssetStatus | None = None


class AssetResponse(AssetBase):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    id: str
    assessment_id: str = Field(
        ...,
        validation_alias=AliasChoices("assessmentId", "assessment_id"),
        serialization_alias="assessmentId",
    )
    status: AssetStatus
    uploaded_at: datetime = Field(
        ...,
        validation_alias=AliasChoices("uploadedAt", "uploaded_at"),
        serialization_alias="uploadedAt",
    )
    file_path: str | None = Field(
        None,
        validation_alias=AliasChoices("filePath", "file_path"),
        serialization_alias="filePath",
    )

