"""Report schemas matching frontend report.model.ts."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, AliasChoices
from app.core.enums import AssessmentRisk, ReportRecommendation


class ReportCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    assessment_id: str = Field(
        ...,
        validation_alias=AliasChoices("assessmentId", "assessment_id"),
        serialization_alias="assessmentId",
    )


class ReportUpdateDecision(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    analyst_decision: ReportRecommendation = Field(
        ...,
        validation_alias=AliasChoices("analystDecision", "analyst_decision"),
        serialization_alias="analystDecision",
    )


class ReportResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, from_attributes=True)

    id: str
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
    confidence: float
    recommendation: ReportRecommendation
    analyst_decision: ReportRecommendation | None = Field(
        None,
        validation_alias=AliasChoices("analystDecision", "analyst_decision"),
        serialization_alias="analystDecision",
    )
    report_file_path: str | None = Field(
        None,
        validation_alias=AliasChoices("reportFilePath", "report_file_path"),
        serialization_alias="reportFilePath",
    )

