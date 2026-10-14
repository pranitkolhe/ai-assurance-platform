"""Report generation and export endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.report import ReportResponse, ReportCreate, ReportUpdateDecision
from app.core.enums import AssessmentRisk, ReportRecommendation

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/{assessment_id}", response_model=ReportResponse)
async def get_report(assessment_id: str, db: AsyncSession = Depends(get_db)):
    return ReportResponse(
        id=f"REP-{assessment_id[:8]}",
        assessment_id=assessment_id,
        generated_at=datetime.now(timezone.utc),
        overall_risk=AssessmentRisk.LOW,
        confidence=0.95,
        recommendation=ReportRecommendation.ACCEPT,
        analyst_decision=None,
    )


@router.post("/decision", response_model=ReportResponse)
async def record_decision(assessment_id: str, payload: ReportUpdateDecision, db: AsyncSession = Depends(get_db)):
    return ReportResponse(
        id=f"REP-{assessment_id[:8]}",
        assessment_id=assessment_id,
        generated_at=datetime.now(timezone.utc),
        overall_risk=AssessmentRisk.LOW,
        confidence=0.95,
        recommendation=ReportRecommendation.ACCEPT,
        analyst_decision=payload.analyst_decision,
    )
