"""Inference-provenance client for the standalone service on port 8104.

Same pattern as dataset_integrity/service.py: never invent a result.
If the provenance service is not running, or returns an error, verify()
returns status "unavailable" so callers return HTTP 503.

Service URL is taken from PROVENANCE_URL, defaulting to
http://127.0.0.1:8104 (see services/inference-provenance/README.md).
"""

from __future__ import annotations

import os

import httpx

from app.engines.paths import resolve_engine_path


class ProvenanceService:
    def __init__(self, base_url: str | None = None, timeout: float = 60.0):
        self.base_url = (base_url or os.getenv(
            "PROVENANCE_URL", "http://127.0.0.1:8104")).rstrip("/")
        self.timeout = timeout

    async def verify(self, manifest: dict,
                     asset_path: str | None = None) -> dict:
        payload: dict = {"manifest": manifest}
        if asset_path:
            payload["asset_path"] = resolve_engine_path(asset_path)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/analyze", json=payload)
        except httpx.HTTPError as exc:
            return self._unavailable_result(str(exc))
        if response.status_code >= 400:
            return self._unavailable_result(
                f"Provenance service returned HTTP {response.status_code}: "
                f"{response.text[:200]}")
        return response.json()

    @staticmethod
    def _unavailable_result(reason: str) -> dict:
        return {
            "domain": "inference_provenance",
            "status": "unavailable",
            "score": 0.0,
            "confidence": 0.0,
            "verified": False,
            "findings": [],
            "limitations": [f"Provenance service unavailable: {reason}"],
        }
