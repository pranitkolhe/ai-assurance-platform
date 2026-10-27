"""Data-integrity service: standalone FastAPI app on port 8101."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from analyzer import analyze_dataset


def _resolve_dataset_path(stored: str) -> str:
    """Second line of defence for the 2026-10-27 404: if the backend
    ever sends a relative path ("data/uploads/..."), resolve it
    against the real project layout before giving up.
    main.py lives in services/data-integrity/, so parents[2] is
    the project root, and backend/ is project-root/backend.
    """
    path = Path(stored)
    if path.is_absolute() or path.exists():
        return str(path)
    project_root = Path(__file__).resolve().parents[2]
    for candidate in (project_root / "backend" / path, project_root / path):
        if candidate.exists():
            return str(candidate)
    return str(project_root / "backend" / path)

app = FastAPI(title="Data Integrity Service", version="1.0.0")


class AnalyzeRequest(BaseModel):
    dataset_path: str
    format: str | None = None
    reference: dict | None = None


@app.get("/health")
async def health() -> dict:
    return {"service": "data-integrity", "status": "ok", "version": "1.0.0"}


@app.get("/")
async def root() -> dict:
    return {"service": "data-integrity", "version": "1.0.0", "docs": "/docs"}


@app.post("/analyze")
async def analyze(payload: AnalyzeRequest) -> dict:
    try:
        return analyze_dataset(_resolve_dataset_path(payload.dataset_path), payload.format, payload.reference)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
