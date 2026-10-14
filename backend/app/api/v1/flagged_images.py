"""Flagged image management endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.db.repositories.flagged_image_repository import FlaggedImageRepository
from app.db.session import get_db
from app.schemas.common import SuccessResponse
from app.schemas.flagged_image import (
    FlaggedImageCreate,
    FlaggedImageResponse,
    FlaggedImageUpdate,
)

router = APIRouter(
    prefix="/flagged-images",
    tags=["flagged_images"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[FlaggedImageResponse], status_code=status.HTTP_200_OK)
async def list_flagged_images(
    assessment_id: UUID | None = Query(None),
    domain: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
) -> list[FlaggedImageResponse]:
    """List flagged images with optional filters."""
    repo = FlaggedImageRepository(db)
    images = await repo.get_all(
        assessment_id=assessment_id,
        domain=domain,
        status=status_filter,
    )
    return [FlaggedImageResponse.model_validate(img) for img in images]


@router.get("/{flagged_image_id}", response_model=FlaggedImageResponse, status_code=status.HTTP_200_OK)
async def get_flagged_image(
    flagged_image_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> FlaggedImageResponse:
    """Return a single flagged image by ID."""
    repo = FlaggedImageRepository(db)
    image = await repo.get_by_id(flagged_image_id)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flagged image not found",
        )
    return FlaggedImageResponse.model_validate(image)


@router.post("/", response_model=FlaggedImageResponse, status_code=status.HTTP_201_CREATED)
async def create_flagged_image(
    payload: FlaggedImageCreate,
    current_user_id: UUID = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FlaggedImageResponse:
    """Create a new flagged image record."""
    repo = FlaggedImageRepository(db)
    image = await repo.create(payload, created_by=current_user_id)
    return FlaggedImageResponse.model_validate(image)


@router.put("/{flagged_image_id}", response_model=FlaggedImageResponse, status_code=status.HTTP_200_OK)
async def update_flagged_image(
    flagged_image_id: UUID,
    payload: FlaggedImageUpdate,
    db: AsyncSession = Depends(get_db),
) -> FlaggedImageResponse:
    """Update a flagged image (typically its review status)."""
    repo = FlaggedImageRepository(db)
    image = await repo.get_by_id(flagged_image_id)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flagged image not found",
        )
    updated = await repo.update(flagged_image_id, payload)
    return FlaggedImageResponse.model_validate(updated)


@router.delete("/{flagged_image_id}", response_model=SuccessResponse, status_code=status.HTTP_200_OK)
async def delete_flagged_image(
    flagged_image_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> SuccessResponse:
    """Delete a flagged image record."""
    repo = FlaggedImageRepository(db)
    image = await repo.get_by_id(flagged_image_id)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flagged image not found",
        )
    await repo.delete(flagged_image_id)
    return SuccessResponse(message="Flagged image deleted successfully")
