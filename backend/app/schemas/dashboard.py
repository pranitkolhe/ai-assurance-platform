"""Dashboard metrics schemas matching frontend dashboard.model.ts."""

from pydantic import BaseModel, ConfigDict, Field
from app.core.enums import AssessmentRisk, AssessmentStatus, Severity


class DashboardStat(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    label: str
    value: int | float
    description: str
    trend: str | None = None


class AssessmentQueueItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    id: str
    name: str
    contributor: str
    assets: int
    risk: AssessmentRisk
    confidence: float
    status: AssessmentStatus
    updated_at: str = Field(..., serialization_alias="updatedAt")


class RecentFinding(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    id: str
    title: str
    type: str
    severity: Severity
    confidence: float
    asset: str
    assessment_id: str = Field(..., serialization_alias="assessmentId")


class AssuranceSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, protected_namespaces=())

    data_integrity: int = Field(..., serialization_alias="dataIntegrity")
    model_integrity: int = Field(..., serialization_alias="modelIntegrity")
    inference_verification: int = Field(..., serialization_alias="inferenceVerification")
    distribution_analysis: int = Field(..., serialization_alias="distributionAnalysis")


class AnalystDashboardData(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    stats: list[DashboardStat]
    queue: list[AssessmentQueueItem]
    findings: list[RecentFinding]
    assurance_summary: AssuranceSummary = Field(..., serialization_alias="assuranceSummary")

