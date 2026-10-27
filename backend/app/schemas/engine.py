"""Shared schemas for the standalone engine services.

Every engine service returns the same core fields (see
services/CONTRACT.md), plus domain-specific fields that are optional
here so one schema can carry all five domains without the backend
having to know each service's internals.

Status values: pass | review | quarantine | unavailable.
"unavailable" means the service is not running, not implemented yet,
or errored -- it must never be displayed as a pass.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class EngineFinding(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str = ""
    title: str = ""
    severity: str = "info"
    reason: str = ""
    evidence: dict = Field(default_factory=dict)
    affected_assets: list[str] = Field(default_factory=list)


class EngineResult(BaseModel):
    model_config = ConfigDict(extra="allow")
    domain: str
    status: str
    score: float = 0.0
    confidence: float = 0.0
    findings: list[EngineFinding] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class EngineAnalyzeRequest(BaseModel):
    """Generic analyze request for POST /engines/{domain}/analyze.

    Send exactly one path field. ``path`` is the generic alias;
    domain-specific fields are accepted for readability and are
    resolved in the same order: path, dataset_path, model_path,
    asset_path.
    """
    path: str | None = None
    dataset_path: str | None = None
    model_path: str | None = None
    asset_path: str | None = None
    clean_dataset_path: str | None = None
    manifest: dict | None = None
    format: str | None = None
    reference: dict | None = None
    access_level: str | None = None

    def resolved_path(self) -> str | None:
        for value in (self.path, self.dataset_path, self.model_path, self.asset_path):
            if value:
                return value
        return None


class EngineStatus(BaseModel):
    service: str
    domain: str
    port: int
    url: str
    status: str
    version: str | None = None
    detail: str | None = None
