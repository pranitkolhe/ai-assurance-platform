"""Asset upload and registration endpoints."""

import hashlib
import os
import shutil
import zipfile
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


@router.get("", response_model=list[AssetResponse])
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
async def get_asset(asset_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    asset = await repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return AssetResponse.model_validate(asset)


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(payload: AssetCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Direct file upload endpoint: streams file to disk, computes SHA256, and stores in PostgreSQL.

    Sync fix (2026-10-27): previously this endpoint never checked
    that the assessment exists, so an upload for a fake/local-only
    assessment id failed on the foreign key and the frontend silently
    fell back to a local asset that the analyst could never see.
    Now a missing assessment is a clean 404, and the uploaded file
    is removed, instead of a 500 + a fake local asset.

    Dataset fix: the data-integrity service analyses a dataset
    DIRECTORY (annotations.json / images / labels), not a single
    file. So a dataset ZIP is extracted to a directory and a single
    COCO JSON is placed in its own directory as annotations.json,
    and file_path points to that directory. A model/inference file
    keeps file_path pointing to the file itself.
    """
    asset_type_norm = asset_type.lower()
    if asset_type_norm not in ("dataset", "model", "inference"):
        raise HTTPException(status_code=400, detail="asset_type must be dataset, model or inference")
    # Assessment must exist in the database first. No fake ids.
    from app.db.repositories.assessment_repository import AssessmentRepository
    assessment_repo = AssessmentRepository(db)
    assessment = await assessment_repo.get_by_id(assessment_id)
    if assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found; create it first, then upload")
    settings = get_settings()
    # Resolve to an absolute path: the stored file_path must work
    # for a service started from any folder, not just backend/.
    upload_dir = Path(settings.UPLOAD_DIR).resolve()
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

    # Resolve the path the engine services will analyse.
    stored_path = dest_path
    try:
        if asset_type_norm == "dataset":
            if dest_path.suffix.lower() == ".zip":
                extract_dir = upload_dir / f"{assessment_id}_{dest_path.stem}"
                extract_dir.mkdir(parents=True, exist_ok=True)
                with zipfile.ZipFile(dest_path, "r") as zf:
                    for member in zf.infolist():
                        # Block path traversal inside the zip.
                        target = (extract_dir / member.filename).resolve()
                        if not str(target).startswith(str(extract_dir.resolve())):
                            raise HTTPException(status_code=400, detail="ZIP contains a path outside the dataset folder")
                        if member.is_dir():
                            target.mkdir(parents=True, exist_ok=True)
                        else:
                            target.parent.mkdir(parents=True, exist_ok=True)
                            with zf.open(member) as src, open(target, "wb") as out:
                                shutil.copyfileobj(src, out)
                # If the zip contained a single top-level folder, use it
                # as the dataset root so annotations.json is at the top.
                children = [p for p in extract_dir.iterdir() if p.is_dir()]
                if len(children) == 1 and not (extract_dir / "annotations.json").exists():
                    stored_path = children[0]
                else:
                    stored_path = extract_dir
                if not (stored_path / 'annotations.json').exists():
                    import json as _json
                    _folders = set()
                    for _p in stored_path.rglob('*.json'):
                        try:
                            _d = _json.loads(_p.read_text(encoding='utf-8'))
                        except (OSError, ValueError):
                            continue
                        if isinstance(_d, dict) and 'images' in _d and 'annotations' in _d:
                            _folders.add(str(_p.parent.relative_to(stored_path)))
                    if len(_folders) > 1:
                        raise HTTPException(status_code=400, detail='ZIP contains multiple datasets (' + ', '.join(sorted(_folders)) + '). Upload one dataset per asset.')
            elif dest_path.suffix.lower() == ".json":
                dataset_dir = upload_dir / f"{assessment_id}_{dest_path.stem}"
                dataset_dir.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(dest_path, dataset_dir / "annotations.json")
                stored_path = dataset_dir
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not prepare dataset for analysis: {exc}")

    repo = AssetRepository(db)
    asset = Asset(
        assessment_id=assessment_id,
        type=asset_type_norm,
        name=file.filename or "uploaded_file",
        format=asset_format.upper(),
        size=size_formatted,
        sha256=computed_sha256,
        file_path=str(stored_path),
        status="submitted",
    )
    saved = await repo.create(asset)
    return AssetResponse.model_validate(saved)
