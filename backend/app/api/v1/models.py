"""Model artifact verification endpoints.

Thin controller only: it resolves a model asset, forwards its stored
file path to the standalone model-integrity service (port 8102), and
returns that service's full result.

BREAKING CHANGE vs the old prototype: the old endpoint returned
hard-coded values (ResNet-50, 0.942 accuracy, backdoor_risk "low") for
every model. That has been removed. If the service is down or not yet
implemented, this returns HTTP 503 instead of a fake inspection.

Legacy route GET /models/{asset_id}/inspection is kept for
compatibility, but it now maps the live service result instead of
inventing values, and returns 503 when the service is unavailable.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.db.models.user import User
from app.db.repositories.asset_repository import AssetRepository
from app.engines.model_integrity.service import ModelIntegrityService

router = APIRouter(prefix="/models", tags=["models"])


async def _inspect(asset_id: str, db: AsyncSession) -> dict:
    repo = AssetRepository(db)
    asset = await repo.get_by_id(asset_id)
    if not asset or asset.type != "model":
        raise HTTPException(status_code=404, detail="Model asset not found")
    if not asset.file_path:
        raise HTTPException(
            status_code=404, detail="Model file path is not stored for this asset")
    result = await ModelIntegrityService().analyze(asset.file_path, asset.format)
    if result.get("status") == "unavailable":
        raise HTTPException(
            status_code=503,
            detail="Model-integrity service is unavailable; no result was fabricated")
    return result


@router.get("/{asset_id}/integrity")
async def get_model_integrity(asset_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    """Full model-integrity result from the standalone service."""
    return await _inspect(asset_id, db)


@router.get("/{asset_id}/inspection")
async def inspect_model(asset_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    """Legacy inspection shape, mapped from the live service result.

    Fields the service does not (yet) return are None, not invented.
    Prefer GET /models/{asset_id}/integrity for the full result.
    """
    result = await _inspect(asset_id, db)
    return {
        "asset_id": asset_id,
        "format": result.get("format"),
        "backbone": result.get("backbone"),
        "input_shape": result.get("input_shape"),
        "num_classes": result.get("num_classes"),
        "tamper_detected": result.get("tamper_detected"),
        "clean_accuracy": result.get("clean_accuracy"),
        "backdoor_risk": result.get("backdoor_risk"),
        "status": result.get("status"),
        "score": result.get("score"),
        "confidence": result.get("confidence"),
        "findings": result.get("findings", []),
        "limitations": result.get("limitations", []),
    }
