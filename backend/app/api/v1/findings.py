"""Findings endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.db.models.finding import Finding
from app.db.models.user import User
from app.db.repositories.finding_repository import FindingRepository
from app.schemas.finding import FindingCreate, FindingResponse

router = APIRouter(prefix="/findings", tags=["findings"])


@router.get("", response_model=list[FindingResponse])
@router.get("/", response_model=list[FindingResponse])
async def list_findings(assessment_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = FindingRepository(db)
    findings = await repo.get_by_assessment(assessment_id)
    return [FindingResponse.model_validate(f) for f in findings]


@router.post("", response_model=FindingResponse)
@router.post("/", response_model=FindingResponse)
async def create_finding(payload: FindingCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = FindingRepository(db)
    finding = Finding(
        assessment_id=payload.assessment_id,
        asset_id=payload.asset_id,
        type=payload.type,
        title=payload.title,
        description=payload.description,
        severity=payload.severity.value,
        confidence=payload.confidence,
        affected_samples=payload.affected_samples,
        detection_method=payload.detection_method,
        status="open",
    )
    saved = await repo.create(finding)
    return FindingResponse.model_validate(saved)
