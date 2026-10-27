"""Backdoor-assessment endpoints.

Thin controller only: it resolves a model asset, forwards its stored
file path to the standalone backdoor service (port 8103), and returns
that service's full result. No backdoor logic lives here.

If the service is down or not yet implemented, this returns HTTP 503.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.db.models.user import User
from app.db.repositories.asset_repository import AssetRepository
from app.engines.backdoor_assessment.service import BackdoorAssessmentService

router = APIRouter(prefix="/backdoor", tags=["backdoor"])


@router.get("/{asset_id}/assessment")
async def assess_backdoor(asset_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    repo = AssetRepository(db)
    asset = await repo.get_by_id(asset_id)
    if not asset or asset.type != "model":
        raise HTTPException(status_code=404, detail="Model asset not found")
    if not asset.file_path:
        raise HTTPException(
            status_code=404, detail="Model file path is not stored for this asset")
    result = await BackdoorAssessmentService().analyze(asset.file_path)
    if result.get("status") == "unavailable":
        raise HTTPException(
            status_code=503,
            detail="Backdoor service is unavailable; no result was fabricated")
    return result
