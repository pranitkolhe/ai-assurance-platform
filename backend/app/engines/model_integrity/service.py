"""Model-integrity client for the standalone service on port 8102.

Same pattern as dataset_integrity/service.py: this client never invents
 a result. If the model-integrity service is not running, or returns an
error, analyze() returns status "unavailable" so callers return HTTP 503
instead of showing a fake pass.

Service URL is taken from MODEL_INTEGRITY_URL, defaulting to
http://127.0.0.1:8102 (see services/model-integrity/README.md).
"""

from __future__ import annotations

import os

import httpx

from app.engines.paths import resolve_engine_path


class ModelIntegrityService:
    def __init__(self, base_url: str | None = None, timeout: float = 120.0):
        self.base_url = (base_url or os.getenv(
            "MODEL_INTEGRITY_URL", "http://127.0.0.1:8102")).rstrip("/")
        self.timeout = timeout

    async def analyze(self, model_path: str,
                      format_hint: str | None = None,
                      reference: dict | None = None,
                      access_level: str | None = None) -> dict:
        payload: dict = {"model_path": resolve_engine_path(model_path)}
        if format_hint:
            payload["format"] = format_hint
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
                f"Model-integrity service returned HTTP {response.status_code}: "
                f"{response.text[:200]}")
        return response.json()

    @staticmethod
    def _unavailable_result(reason: str) -> dict:
        return {
            "domain": "model_integrity",
            "status": "unavailable",
            "score": 0.0,
            "confidence": 0.0,
            "findings": [],
            "limitations": [f"Model-integrity service unavailable: {reason}"],
        }
