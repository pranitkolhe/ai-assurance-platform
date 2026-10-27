"""Model-integrity service: standalone FastAPI app on port 8102."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException

from analyzer import analyze_model
from schemas import AnalyzeRequest

app = FastAPI(title="Model Integrity Service", version="0.1.0")


@app.get("/health")
async def health() -> dict:
    return {"service": "model-integrity", "status": "ok", "version": "0.1.0"}


@app.get("/")
async def root() -> dict:
    return {"service": "model-integrity", "version": "0.1.0", "docs": "/docs"}


@app.post("/analyze")
async def analyze(payload: AnalyzeRequest) -> dict:
    path = payload.resolved_path()
    if not path:
        raise HTTPException(status_code=422, detail="A model path is required")
    try:
        return analyze_model(path, payload.format, payload.reference, payload.access_level)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
