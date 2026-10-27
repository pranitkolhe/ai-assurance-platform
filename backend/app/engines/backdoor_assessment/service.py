"""Backdoor-assessment client for the standalone service on port 8103.

Same pattern as dataset_integrity/service.py: never invent a result.
If the backdoor service is not running, or returns an error, analyze()
returns status "unavailable" so callers return HTTP 503.

Service URL is taken from BACKDOOR_URL, defaulting to
http://127.0.0.1:8103 (see services/backdoor-assessment/README.md).
"""

from __future__ import annotations

import os

import httpx

from app.engines.paths import resolve_engine_path


class BackdoorAssessmentService:
    def __init__(self, base_url: str | None = None, timeout: float = 300.0):
        self.base_url = (base_url or os.getenv(
            "BACKDOOR_URL", "http://127.0.0.1:8103")).rstrip("/")
        self.timeout = timeout

    async def analyze(self, model_path: str,
                      clean_dataset_path: str | None = None,
                      reference: dict | None = None,
                      access_level: str | None = None) -> dict:
        payload: dict = {"model_path": resolve_engine_path(model_path)}
        if clean_dataset_path:
            payload["clean_dataset_path"] = resolve_engine_path(clean_dataset_path)
        if reference is not None:
            payload["reference"] = reference
        if access_level:
            payload["access_level"] = access_level
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/analyze", json=payload)
        except httpx.HTTPError as exc:
            return self._unavailable_result(str(exc))
        if response.status_code >= 400:
            return self._unavailable_result(
                f"Backdoor service returned HTTP {response.status_code}: "
                f"{response.text[:200]}")
        return response.json()

    @staticmethod
    def _unavailable_result(reason: str) -> dict:
        return {
            "domain": "backdoor_assessment",
            "status": "unavailable",
            "score": 0.0,
            "confidence": 0.0,
            "findings": [],
            "limitations": [f"Backdoor service unavailable: {reason}"],
        }
