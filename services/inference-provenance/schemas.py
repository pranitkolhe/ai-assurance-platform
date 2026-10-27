"""Request/response schemas for the inference-provenance service."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    manifest: dict | None = None
    asset_path: str | None = None
    path: str | None = None
    reference: dict | None = None

    def resolved_path(self) -> str | None:
        for value in (self.asset_path, self.path):
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
    domain: str = "inference_provenance"
    status: str
    score: float = 0.0
    confidence: float = 0.0
    verified: bool = False
    binding_hash: str | None = None
    expected_binding_hash: str | None = None
    tamper_detected: bool | None = None
    replay_detected: bool | None = None
    findings: list[Finding] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    unsupported: list[str] = Field(default_factory=list)
