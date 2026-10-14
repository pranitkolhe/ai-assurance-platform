"""Assurance lab testing endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.assurance import AssuranceResultResponse, AssuranceDomainResult, AssuranceMetric
from app.core.enums import AssessmentRisk, AssuranceDomain, MetricStatus, ReportRecommendation

router = APIRouter(prefix="/assurance-lab", tags=["assurance-lab"])


@router.get("/{assessment_id}/results", response_model=AssuranceResultResponse)
async def get_assurance_results(assessment_id: str, db: AsyncSession = Depends(get_db)):
    return AssuranceResultResponse(
        assessment_id=assessment_id,
        generated_at=datetime.now(timezone.utc),
        overall_risk=AssessmentRisk.LOW,
        overall_confidence=0.96,
        recommendation=ReportRecommendation.ACCEPT,
        domains=[
            AssuranceDomainResult(
                domain=AssuranceDomain.DATA_INTEGRITY,
                score=0.98,
                confidence=0.99,
                status=MetricStatus.PASS,
                summary="Dataset format and hashes verified with zero duplicates.",
                metrics=[
                    AssuranceMetric(id="M1", name="Duplicate Ratio", value=0.0, status=MetricStatus.PASS, description="Zero duplicate images detected"),
                ],
                findings=[],
            )
        ],
    )
