"""Finding schemas matching frontend finding.model.ts."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, AliasChoices
from app.core.enums import FindingStatus, Severity


class FindingBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    type: str
    title: str
    description: str = ""
    severity: Severity = Severity.MEDIUM
    confidence: float = 0.0
    affected_samples: int = Field(
        0,
        validation_alias=AliasChoices("affectedSamples", "affected_samples"),
        serialization_alias="affectedSamples",
    )
    detection_method: str = Field(
        "Automated",
        validation_alias=AliasChoices("detectionMethod", "detection_method"),
        serialization_alias="detectionMethod",
    )


class FindingCreate(FindingBase):
    assessment_id: str = Field(
        ...,
        validation_alias=AliasChoices("assessmentId", "assessment_id"),
        serialization_alias="assessmentId",
    )
    asset_id: str = Field(
        ...,
        validation_alias=AliasChoices("assetId", "asset_id"),
        serialization_alias="assetId",
    )


class FindingUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    status: FindingStatus | None = None
    severity: Severity | None = None
    description: str | None = None


class FindingResponse(FindingBase):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    id: str
    assessment_id: str = Field(
        ...,
        validation_alias=AliasChoices("assessmentId", "assessment_id"),
        serialization_alias="assessmentId",
    )
    asset_id: str = Field(
        ...,
        validation_alias=AliasChoices("assetId", "asset_id"),
        serialization_alias="assetId",
    )
    status: FindingStatus
    created_at: datetime = Field(
        ...,
        validation_alias=AliasChoices("createdAt", "created_at"),
        serialization_alias="createdAt",
    )

