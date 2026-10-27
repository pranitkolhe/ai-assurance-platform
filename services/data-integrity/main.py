"""Data-integrity service: standalone FastAPI app on port 8101."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from analyzer import analyze_dataset

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
        return analyze_dataset(payload.dataset_path, payload.format, payload.reference)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
