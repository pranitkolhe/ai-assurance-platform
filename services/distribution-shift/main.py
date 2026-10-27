"""Distribution-shift service: standalone FastAPI app on port 8105."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException

from analyzer import analyze_distribution_shift
from schemas import AnalyzeRequest

app = FastAPI(title="Distribution Shift Service", version="0.1.0")


@app.get("/health")
async def health() -> dict:
    return {"service": "distribution-shift", "status": "ok", "version": "0.1.0"}


@app.get("/")
async def root() -> dict:
    return {"service": "distribution-shift", "version": "0.1.0", "docs": "/docs"}


@app.post("/analyze")
async def analyze(payload: AnalyzeRequest) -> dict:
    path = payload.resolved_path()
    if not path:
        raise HTTPException(status_code=422, detail="A dataset path is required")
    try:
        return analyze_distribution_shift(path, payload.reference)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
