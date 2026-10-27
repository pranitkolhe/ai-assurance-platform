"""Unified engine-service routes.

This is the single communication layer friends working on a service
need: it does not contain any analysis logic itself. It forwards to
the standalone service for that domain and returns the service's full
result unchanged.

Routes:
  GET  /engines/status                 -- health of all five services
  POST /engines/{domain}/analyze       -- run one domain's service

Domains: data_integrity, model_integrity, backdoor_assessment,
         inference_provenance, distribution_shift.

If a service is down or returns status "unavailable", this layer
returns HTTP 503. It never converts an unavailable service into a
pass, a score, or a fabricated finding.

Service URLs come from the environment (see backend/app/config.py):
  DATA_INTEGRITY_URL (8101), MODEL_INTEGRITY_URL (8102),
  BACKDOOR_URL (8103), PROVENANCE_URL (8104),
  DISTRIBUTION_SHIFT_URL (8105).
"""

from __future__ import annotations

import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.db.models.user import User

from app.engines.dataset_integrity.service import DatasetIntegrityService
from app.engines.model_integrity.service import ModelIntegrityService
from app.engines.backdoor_assessment.service import BackdoorAssessmentService
from app.engines.provenance.service import ProvenanceService
from app.engines.distribution_shift.service import DistributionShiftService
from app.schemas.engine import EngineAnalyzeRequest, EngineStatus

router = APIRouter(prefix="/engines", tags=["engines"])

SERVICES = [
    ("data-integrity", "data_integrity", 8101, "DATA_INTEGRITY_URL"),
    ("model-integrity", "model_integrity", 8102, "MODEL_INTEGRITY_URL"),
    ("backdoor-assessment", "backdoor_assessment", 8103, "BACKDOOR_URL"),
    ("inference-provenance", "inference_provenance", 8104, "PROVENANCE_URL"),
    ("distribution-shift", "distribution_shift", 8105, "DISTRIBUTION_SHIFT_URL"),
]

_DEFAULTS = {
    "DATA_INTEGRITY_URL": "http://127.0.0.1:8101",
    "MODEL_INTEGRITY_URL": "http://127.0.0.1:8102",
    "BACKDOOR_URL": "http://127.0.0.1:8103",
    "PROVENANCE_URL": "http://127.0.0.1:8104",
    "DISTRIBUTION_SHIFT_URL": "http://127.0.0.1:8105",
}


def _service_url(env_name: str) -> str:
    return os.getenv(env_name, _DEFAULTS[env_name]).rstrip("/")


@router.get("/status", response_model=list[EngineStatus])
async def engine_status() -> list[EngineStatus]:
    results: list[EngineStatus] = []
    async with httpx.AsyncClient(timeout=2.0) as client:
        for service, domain, port, env_name in SERVICES:
            url = _service_url(env_name)
            try:
                response = await client.get(f"{url}/health")
                if response.status_code == 200:
                    data = response.json()
                    results.append(EngineStatus(
                        service=service, domain=domain, port=port, url=url,
                        status="ok", version=str(data.get("version", "")),
                    ))
                else:
                    results.append(EngineStatus(
                        service=service, domain=domain, port=port, url=url,
                        status="unavailable",
                        detail=f"HTTP {response.status_code}",
                    ))
            except httpx.HTTPError as exc:
                results.append(EngineStatus(
                    service=service, domain=domain, port=port, url=url,
                    status="unavailable", detail=str(exc),
                ))
    return results


@router.post("/{domain}/analyze")
async def analyze_domain(domain: str, payload: EngineAnalyzeRequest, current_user: User = Depends(get_current_user)) -> dict:
    if domain == "data_integrity":
        path = payload.resolved_path()
        if not path:
            raise HTTPException(status_code=422, detail="A dataset path is required")
        result = await DatasetIntegrityService().analyze(
            path, payload.format, payload.reference)
    elif domain == "model_integrity":
        path = payload.resolved_path()
        if not path:
            raise HTTPException(status_code=422, detail="A model path is required")
        result = await ModelIntegrityService().analyze(
            path, payload.format, payload.reference, payload.access_level)
    elif domain == "backdoor_assessment":
        path = payload.resolved_path()
        if not path:
            raise HTTPException(status_code=422, detail="A model path is required")
        result = await BackdoorAssessmentService().analyze(
            path, payload.clean_dataset_path, payload.reference, payload.access_level)
    elif domain == "inference_provenance":
        if not payload.manifest:
            raise HTTPException(status_code=422, detail="A manifest object is required")
        result = await ProvenanceService().verify(
            payload.manifest, payload.resolved_path())
    elif domain == "distribution_shift":
        path = payload.resolved_path()
        if not path:
            raise HTTPException(status_code=422, detail="A dataset path is required")
        result = await DistributionShiftService().analyze(path, payload.reference)
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown engine domain: {domain}. "
                   "Use data_integrity, model_integrity, backdoor_assessment, "
                   "inference_provenance or distribution_shift.")
    if result.get("status") == "unavailable":
        raise HTTPException(
            status_code=503,
            detail=f"{domain} service is unavailable; no result was fabricated. "
                   f"{'; '.join(result.get('limitations', []))}")
    return result
