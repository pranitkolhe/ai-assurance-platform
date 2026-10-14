"""Assessment management endpoints."""

from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.db.models.assessment import Assessment
from app.db.models.user import User
from app.db.repositories.assessment_repository import AssessmentRepository
from app.db.repositories.asset_repository import AssetRepository
from app.db.repositories.finding_repository import FindingRepository
from app.db.session import get_db
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentDetailResponse,
    AssessmentResponse,
    AssessmentUpdate,
    ProcessingState,
)
from app.schemas.asset import AssetResponse
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.get("/", response_model=list[AssessmentResponse])
async def list_assessments(
    status_filter: str | None = Query(None, alias="status"),
    contributor_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AssessmentResponse]:
    """List assessments with role-based filtering."""
    # Role-based scoping: Contributors only see their own assessments
    if current_user.role == "contributor":
        contributor_id = current_user.id

    repo = AssessmentRepository(db)
    assessments = await repo.get_all(status=status_filter, contributor_id=contributor_id)
    result = []
    for a in assessments:
        proc = None
        if a.processing_status:
            proc = ProcessingState(
                status=a.processing_status,
                progress=a.processing_progress,
                current_step=a.processing_current_step or "",
                started_at=a.processing_started_at,
                completed_at=a.processing_completed_at,
            )
        result.append(
            AssessmentResponse(
                id=a.id,
                name=a.name,
                use_case=a.use_case,
                task=a.task,
                contributor_id=a.contributor_id,
                contributor_name=a.contributor.name if a.contributor else None,
                status=a.status,
                overall_risk=a.overall_risk,
                confidence=a.confidence,
                created_at=a.created_at,
                processing=proc,
            )
        )
    return result


@router.get("/{assessment_id}", response_model=AssessmentDetailResponse)
async def get_assessment(assessment_id: str, db: AsyncSession = Depends(get_db)) -> AssessmentDetailResponse:
    """Return a single assessment with its assets and findings count."""
    repo = AssessmentRepository(db)
    assessment = await repo.get_by_id(assessment_id)
    if assessment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    asset_repo = AssetRepository(db)
    assets = await asset_repo.get_by_assessment(assessment_id)

    finding_repo = FindingRepository(db)
    findings_cnt = await finding_repo.count_by_assessment(assessment_id)

    proc = None
    if assessment.processing_status:
        proc = ProcessingState(
            status=assessment.processing_status,
            progress=assessment.processing_progress,
            current_step=assessment.processing_current_step or "",
            started_at=assessment.processing_started_at,
            completed_at=assessment.processing_completed_at,
        )

    return AssessmentDetailResponse(
        id=assessment.id,
        name=assessment.name,
        use_case=assessment.use_case,
        task=assessment.task,
        contributor_id=assessment.contributor_id,
        contributor_name=assessment.contributor.name if assessment.contributor else None,
        status=assessment.status,
        overall_risk=assessment.overall_risk,
        confidence=assessment.confidence,
        created_at=assessment.created_at,
        processing=proc,
        assets=[AssetResponse.model_validate(ast) for ast in assets],
        findings_count=findings_cnt,
    )


@router.post("/", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(payload: AssessmentCreate, db: AsyncSession = Depends(get_db)) -> AssessmentResponse:
    """Create a new assessment."""
    repo = AssessmentRepository(db)
    assessment = Assessment(
        name=payload.name,
        contributor_id=payload.contributor_id,
        use_case=payload.use_case,
        task=payload.task,
        status="submitted",
        processing_status="submitted",
        processing_progress=0.0,
        processing_current_step="Intake validation",
    )
    saved = await repo.create(assessment)
    return AssessmentResponse(
        id=saved.id,
        name=saved.name,
        use_case=saved.use_case,
        task=saved.task,
        contributor_id=saved.contributor_id,
        status=saved.status,
        overall_risk=saved.overall_risk,
        confidence=saved.confidence,
        created_at=saved.created_at,
    )


@router.delete("/{assessment_id}", response_model=SuccessResponse)
async def delete_assessment(assessment_id: str, db: AsyncSession = Depends(get_db)) -> SuccessResponse:
    """Delete an assessment."""
    repo = AssessmentRepository(db)
    assessment = await repo.get_by_id(assessment_id)
    if assessment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    await repo.delete(assessment)
    return SuccessResponse(message="Assessment deleted successfully")
