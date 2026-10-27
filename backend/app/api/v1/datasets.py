"""Dataset integrity inspection endpoints."""

from pathlib import Path

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
    # Pre-check (2026-10-27): do not send a non-existent path to the
    # service and then report a vague 503. If the file/directory is
    # gone (old DB row, deleted upload, wrong working directory),
    # say so plainly with the stored path, so the fix is obvious:
    # re-upload that dataset.
    from app.engines.paths import resolve_engine_path
    resolved_path = resolve_engine_path(asset.file_path)
    if not Path(resolved_path).exists():
        raise HTTPException(
            status_code=404,
            detail=f"Dataset path not found on disk: {resolved_path} "
            f"(stored: {asset.file_path}). Re-upload this dataset.")
    service = DatasetIntegrityService()
    result = await service.analyze(asset.file_path, asset.format)
    if result.get("status") == "unavailable":
        reason = (result.get("limitations") or [""])[0]
        raise HTTPException(
            status_code=503,
            detail=f"Data-integrity check unavailable: {reason}")
    # Include the finding reason, not just the title: without it a
    # failed analysis only showed "critical: Dataset could not be
    # analysed" and hid the actual cause (e.g. "No COCO annotation
    # JSON file was found."), which made the dataset structure
    # problem impossible to diagnose from the UI.
    warnings = []
    for finding in result.get("findings", []):
        text = f"{finding.get('severity', 'info')}: {finding.get('title', '')}"
        if finding.get("reason"):
            text += f" — {finding['reason']}"
        warnings.append(text)
    return DatasetInspectionResult(
        asset_id=asset.id,
        format=DatasetFormat.COCO if "coco" in asset.format.lower() else DatasetFormat.YOLO,
        valid=result.get("status") == "pass",
        total_images=int(result.get("total_images", 0)),
        total_annotations=int(result.get("total_annotations", 0)),
        duplicate_count=int(result.get("duplicate_count", 0)),
        corrupt_samples_count=int(result.get("corrupt_samples_count", 0)),
        warnings=warnings,
        score=round(float(result.get("score", 0)) * 100, 1),
        confidence=round(float(result.get("confidence", 0)) * 100, 1),
        engine_status=str(result.get("status", '')),
    )
