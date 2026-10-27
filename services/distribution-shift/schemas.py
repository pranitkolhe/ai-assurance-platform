"""Request/response schemas for the distribution-shift service."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    path: str | None = None
    dataset_path: str | None = None
    asset_path: str | None = None
    reference: dict | None = None

    def resolved_path(self) -> str | None:
        for value in (self.path, self.dataset_path, self.asset_path):
            if value:
                return value
        return None


class Finding(BaseModel):
    id: str = ""
    title: str = ""
    severity: str = "info"
    reason: str = ""
    evidence: dict = Field(default_factory=dict)
    affected_assets: list[str] = Field(default_factory=list)


class AnalyzeResult(BaseModel):
    domain: str = "distribution_shift"
    status: str
    score: float = 0.0
    confidence: float = 0.0
    max_deviation: float = 0.0
    mean_deviation: float = 0.0
    class_distribution: dict = Field(default_factory=dict)
    reference_distribution: dict = Field(default_factory=dict)
    covariate_shift_detected: bool = False
    concept_drift_detected: bool = False
    findings: list[Finding] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    unsupported: list[str] = Field(default_factory=list)
