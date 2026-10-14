"""Asset upload and registration endpoints."""

import hashlib
import os
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select
from app.config import get_settings
from app.db.session import get_db
from app.db.models.asset import Asset
from app.db.models.assessment import Assessment
from app.db.models.user import User
from app.dependencies import get_current_user
from app.db.repositories.asset_repository import AssetRepository
from app.schemas.asset import AssetCreate, AssetResponse, AssetUpdate
from app.schemas.common import SuccessResponse
from app.utils.file_validation import format_file_size, validate_file_format

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/", response_model=list[AssetResponse])
async def list_assets(
    assessment_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = AssetRepository(db)
    if assessment_id:
        assets = await repo.get_by_assessment(assessment_id)
    elif current_user.role == "contributor":
        stmt = (
            select(Asset)
            .join(Assessment, Asset.assessment_id == Assessment.id)
            .where(Assessment.contributor_id == current_user.id)
        )
        res = await db.execute(stmt)
        assets = res.scalars().all()
    else:
        assets = await repo.get_all()
    return [AssetResponse.model_validate(a) for a in assets]



@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    asset = await repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetResponse.model_validate(asset)


@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(payload: AssetCreate, db: AsyncSession = Depends(get_db)):
    """Register an asset metadata record."""
    repo = AssetRepository(db)
    asset = Asset(
        assessment_id=payload.assessment_id,
        type=payload.type.value if hasattr(payload.type, "value") else str(payload.type),
        name=payload.name,
        format=payload.format,
        size=payload.size,
        sha256=payload.sha256,
        status="submitted",
    )
    saved = await repo.create(asset)
    return AssetResponse.model_validate(saved)


@router.post("/upload", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def upload_asset_file(
    file: UploadFile = File(...),
    assessment_id: str = Form(...),
    asset_type: str = Form(...),
    asset_format: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """Direct file upload endpoint: streams file to disk, computes SHA256, and stores in PostgreSQL."""
    settings = get_settings()
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    dest_path = upload_dir / f"{assessment_id}_{file.filename}"
    sha256_hash = hashlib.sha256()
    total_bytes = 0

    with open(dest_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            sha256_hash.update(chunk)
            total_bytes += len(chunk)
            f.write(chunk)

    size_formatted = f"{total_bytes / (1024 * 1024):.1f} MB"
    computed_sha256 = sha256_hash.hexdigest()

    repo = AssetRepository(db)
    asset = Asset(
        assessment_id=assessment_id,
        type=asset_type.lower(),
        name=file.filename or "uploaded_file",
        format=asset_format.upper(),
        size=size_formatted,
        sha256=computed_sha256,
        file_path=str(dest_path),
        status="verified",
    )
    saved = await repo.create(asset)
    return AssetResponse.model_validate(saved)
