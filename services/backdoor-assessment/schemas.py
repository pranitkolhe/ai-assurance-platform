"""Request/response schemas for the backdoor-assessment service."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    path: str | None = None
    model_path: str | None = None
    asset_path: str | None = None
    clean_dataset_path: str | None = None
    reference: dict | None = None
    access_level: str | None = None

    def resolved_path(self) -> str | None:
        for value in (self.path, self.model_path, self.asset_path):
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
    domain: str = "backdoor_assessment"
    status: str
    score: float = 0.0
    confidence: float = 0.0
    model_sha256: str | None = None
    model_size_bytes: int | None = None
    trigger_detected: bool | None = None
    target_class: int | None = None
    attack_success_rate: float | None = None
    clean_accuracy: float | None = None
    findings: list[Finding] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    unsupported: list[str] = Field(default_factory=list)
