"""Backdoor-assessment service: standalone FastAPI app on port 8103."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException

from analyzer import analyze_backdoor
from schemas import AnalyzeRequest

app = FastAPI(title="Backdoor Assessment Service", version="0.1.0")


@app.get("/health")
async def health() -> dict:
    return {"service": "backdoor-assessment", "status": "ok", "version": "0.1.0"}


@app.get("/")
async def root() -> dict:
    return {"service": "backdoor-assessment", "version": "0.1.0", "docs": "/docs"}


@app.post("/analyze")
async def analyze(payload: AnalyzeRequest) -> dict:
    path = payload.resolved_path()
    if not path:
        raise HTTPException(status_code=422, detail="A model path is required")
    try:
        return analyze_backdoor(path, payload.clean_dataset_path, payload.reference, payload.access_level)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
