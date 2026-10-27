"""Dataset integrity inspection endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.db.models.user import User
from app.db.repositories.asset_repository import AssetRepository
from app.engines.dataset_integrity.service import DatasetIntegrityService
from app.schemas.dataset import DatasetInspectionResult
from app.core.enums import DatasetFormat

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("/{asset_id}/integrity", response_model=DatasetInspectionResult)
async def get_dataset_integrity(asset_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    asset = await repo.get_by_id(asset_id)
    if not asset or asset.type != "dataset":
        raise HTTPException(status_code=404, detail="Dataset asset not found")
    if not asset.file_path:
        raise HTTPException(
            status_code=404, detail="Dataset file path is not stored for this asset")
    service = DatasetIntegrityService()
    result = await service.analyze(asset.file_path, asset.format)
    if result.get("status") == "unavailable":
        raise HTTPException(
            status_code=503,
            detail="Data-integrity service is unavailable; no result was fabricated")
    warnings = [
        f"{finding.get('severity', 'info')}: {finding.get('title', '')}"
        for finding in result.get("findings", [])
    ]
    return DatasetInspectionResult(
        asset_id=asset.id,
        format=DatasetFormat.COCO if "coco" in asset.format.lower() else DatasetFormat.YOLO,
        valid=result.get("status") == "pass",
        total_images=int(result.get("total_images", 0)),
        total_annotations=int(result.get("total_annotations", 0)),
        duplicate_count=int(result.get("duplicate_count", 0)),
        corrupt_samples_count=int(result.get("corrupt_samples_count", 0)),
        warnings=warnings,
    )
