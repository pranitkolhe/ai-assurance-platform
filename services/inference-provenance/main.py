"""Inference-provenance service: standalone FastAPI app on port 8104."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException

from analyzer import verify_provenance
from schemas import AnalyzeRequest

app = FastAPI(title="Inference Provenance Service", version="0.1.0")


@app.get("/health")
async def health() -> dict:
    return {"service": "inference-provenance", "status": "ok", "version": "0.1.0"}


@app.get("/")
async def root() -> dict:
    return {"service": "inference-provenance", "version": "0.1.0", "docs": "/docs"}


@app.post("/analyze")
async def analyze(payload: AnalyzeRequest) -> dict:
    if not payload.manifest:
        raise HTTPException(status_code=422, detail="A manifest object is required")
    try:
        return verify_provenance(payload.manifest, payload.resolved_path(), payload.reference)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
