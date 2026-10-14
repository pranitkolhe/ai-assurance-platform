"""Assessment schemas matching frontend assessment.model.ts."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, AliasChoices
from app.core.enums import AssessmentRisk, AssessmentStatus, ProcessingStatus
from app.schemas.asset import AssetResponse


class ProcessingState(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    status: ProcessingStatus
    progress: float = 0.0
    current_step: str = Field(
        "Pending",
        validation_alias=AliasChoices("currentStep", "current_step"),
        serialization_alias="currentStep",
    )
    started_at: datetime | None = Field(
        None,
        validation_alias=AliasChoices("startedAt", "started_at"),
        serialization_alias="startedAt",
    )
    completed_at: datetime | None = Field(
        None,
        validation_alias=AliasChoices("completedAt", "completed_at"),
        serialization_alias="completedAt",
    )


class AssessmentBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    name: str
    use_case: str = Field(
        "Computer Vision Assurance",
        validation_alias=AliasChoices("useCase", "use_case"),
        serialization_alias="useCase",
    )
    task: str = "Object Detection"


class AssessmentCreate(AssessmentBase):
    contributor_id: str = Field(
        ...,
        validation_alias=AliasChoices("contributorId", "contributor_id"),
        serialization_alias="contributorId",
    )


class AssessmentUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    name: str | None = None
    status: AssessmentStatus | None = None
    overall_risk: AssessmentRisk | None = Field(
        None,
        validation_alias=AliasChoices("overallRisk", "overall_risk"),
        serialization_alias="overallRisk",
    )
    confidence: float | None = None


class AssessmentResponse(AssessmentBase):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    id: str
    contributor_id: str = Field(
        ...,
        validation_alias=AliasChoices("contributorId", "contributor_id"),
        serialization_alias="contributorId",
    )
    contributor_name: str | None = Field(
        None,
        validation_alias=AliasChoices("contributorName", "contributor_name"),
        serialization_alias="contributorName",
    )
    status: AssessmentStatus
    overall_risk: AssessmentRisk | None = Field(
        None,
        validation_alias=AliasChoices("overallRisk", "overall_risk"),
        serialization_alias="overallRisk",
    )
    confidence: float = 0.0
    created_at: datetime = Field(
        ...,
        validation_alias=AliasChoices("createdAt", "created_at"),
        serialization_alias="createdAt",
    )
    processing: ProcessingState | None = None


class AssessmentDetailResponse(AssessmentResponse):
    assets: list[AssetResponse] = []
    findings_count: int = Field(
        0,
        validation_alias=AliasChoices("findingsCount", "findings_count"),
        serialization_alias="findingsCount",
    )

