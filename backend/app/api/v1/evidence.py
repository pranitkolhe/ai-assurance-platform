"""Evidence management endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.db.repositories.evidence_repository import EvidenceRepository
from app.db.session import get_db
from app.schemas.common import SuccessResponse
from app.schemas.evidence import EvidenceCreate, EvidenceResponse

router = APIRouter(
    prefix="/evidence",
    tags=["evidence"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[EvidenceResponse], status_code=status.HTTP_200_OK)
async def list_evidence(
    finding_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> list[EvidenceResponse]:
    """List evidence records, optionally filtered by finding."""
    repo = EvidenceRepository(db)
    records = await repo.get_all(finding_id=finding_id)
    return [EvidenceResponse.model_validate(e) for e in records]


@router.get("/{evidence_id}", response_model=EvidenceResponse, status_code=status.HTTP_200_OK)
async def get_evidence(
    evidence_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> EvidenceResponse:
    """Return a single evidence record by ID."""
    repo = EvidenceRepository(db)
    evidence = await repo.get_by_id(evidence_id)
    if evidence is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found",
        )
    return EvidenceResponse.model_validate(evidence)


@router.post("/", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
async def create_evidence(
    payload: EvidenceCreate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EvidenceResponse:
    """Create a new evidence record."""
    repo = EvidenceRepository(db)
    evidence = await repo.create(payload, created_by=current_user_id)
    return EvidenceResponse.model_validate(evidence)


@router.delete("/{evidence_id}", response_model=SuccessResponse, status_code=status.HTTP_200_OK)
async def delete_evidence(
    evidence_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> SuccessResponse:
    """Delete an evidence record."""
    repo = EvidenceRepository(db)
    evidence = await repo.get_by_id(evidence_id)
    if evidence is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found",
        )
    await repo.delete(evidence_id)
    return SuccessResponse(message="Evidence deleted successfully")
