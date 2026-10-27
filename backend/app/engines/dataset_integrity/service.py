"""Dataset-integrity client for the standalone service.

This replaces the old hard-coded stub. It never invents a result:
if the data-integrity service is not running, analyze() returns a
result with status "unavailable" so callers can report that honestly
instead of showing a fake pass.

Service URL is taken from DATA_INTEGRITY_URL, defaulting to
http://127.0.0.1:8101 (see services/data-integrity/README.md).
"""

from __future__ import annotations

import os

import httpx

from app.engines.paths import resolve_engine_path


class DatasetIntegrityService:
    def __init__(self, base_url: str | None = None, timeout: float = 60.0):
        self.base_url = (base_url or os.getenv(
            "DATA_INTEGRITY_URL", "http://127.0.0.1:8101")).rstrip("/")
        self.timeout = timeout

    async def analyze(self, dataset_path: str,
                      format_hint: str | None = None,
                      reference: dict | None = None) -> dict:
        payload: dict = {"dataset_path": resolve_engine_path(dataset_path)}
        if format_hint:
            payload["format"] = format_hint
        if reference is not None:
            payload["reference"] = reference
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/analyze", json=payload)
        except httpx.HTTPError as exc:
            return self._unavailable_result(str(exc))
        if response.status_code == 404:
            return self._unavailable_result(
                f"Dataset path not found by data-integrity service: {dataset_path}")
        if response.status_code >= 400:
            return self._unavailable_result(
                f"Data-integrity service returned HTTP {response.status_code}: "
                f"{response.text[:200]}")
        return response.json()

    @staticmethod
    def _unavailable_result(reason: str) -> dict:
        return {
            "domain": "data_integrity",
            "format": "unknown",
            "status": "unavailable",
            "score": 0.0,
            "confidence": 0.0,
            "total_images": 0,
            "total_annotations": 0,
            "duplicate_count": 0,
            "corrupt_samples_count": 0,
            "missing_files_count": 0,
            "invalid_annotations_count": 0,
            "class_distribution": {},
            "source_risk": [],
            "findings": [],
            "limitations": [f"Data-integrity service unavailable: {reason}"],
        }
