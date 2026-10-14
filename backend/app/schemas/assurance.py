"""Assurance analysis schemas matching frontend assurance.model.ts."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, AliasChoices
from app.core.enums import AssessmentRisk, AssuranceDomain, MetricStatus, ReportRecommendation, Severity


class AssuranceMetric(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    id: str
    name: str
    value: float
    unit: str | None = None
    status: MetricStatus
    description: str


class AssuranceFinding(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    id: str
    title: str
    description: str
    severity: Severity
    confidence: float
    affected_samples: int = Field(
        ...,
        validation_alias=AliasChoices("affectedSamples", "affected_samples"),
        serialization_alias="affectedSamples",
    )
    detection_method: str = Field(
        ...,
        validation_alias=AliasChoices("detectionMethod", "detection_method"),
        serialization_alias="detectionMethod",
    )


class AssuranceDomainResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    domain: AssuranceDomain
    score: float
    confidence: float
    status: MetricStatus
    summary: str
    metrics: list[AssuranceMetric] = []
    findings: list[AssuranceFinding] = []


class AssuranceResultResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    assessment_id: str = Field(
        ...,
        validation_alias=AliasChoices("assessmentId", "assessment_id"),
        serialization_alias="assessmentId",
    )
    generated_at: datetime = Field(
        ...,
        validation_alias=AliasChoices("generatedAt", "generated_at"),
        serialization_alias="generatedAt",
    )
    overall_risk: AssessmentRisk = Field(
        ...,
        validation_alias=AliasChoices("overallRisk", "overall_risk"),
        serialization_alias="overallRisk",
    )
    overall_confidence: float = Field(
        ...,
        validation_alias=AliasChoices("overallConfidence", "overall_confidence"),
        serialization_alias="overallConfidence",
    )
    recommendation: ReportRecommendation
    domains: list[AssuranceDomainResult] = []

