"""Distribution shift analysis endpoints.

Thin controller only: it resolves an assessment's dataset asset,
forwards its stored file path to the standalone distribution-shift
service (port 8105), and returns that service's full result.

BREAKING CHANGE vs the old prototype: the old endpoint returned
fixed values (wasserstein 0.042, ks p-value 0.38, status pass) for
every assessment without reading any data. That has been removed.
If no dataset asset is found, this returns 404; if the service is
down or not yet implemented, it returns HTTP 503.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.db.models.user import User
from app.db.repositories.assessment_repository import AssessmentRepository
from app.db.repositories.asset_repository import AssetRepository
from app.engines.distribution_shift.service import DistributionShiftService

router = APIRouter(prefix="/distribution-shift", tags=["distribution-shift"])


@router.get("/{assessment_id}/summary")
async def get_distribution_shift_summary(assessment_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    assessment_repo = AssessmentRepository(db)
    assessment = await assessment_repo.get_by_id(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    asset_repo = AssetRepository(db)
    assets = await asset_repo.get_by_assessment(assessment_id)
    dataset = next((a for a in assets if a.type == "dataset" and a.file_path), None)
    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="No dataset asset with a stored file path for this assessment")
    result = await DistributionShiftService().analyze(dataset.file_path)
    if result.get("status") == "unavailable":
        raise HTTPException(
            status_code=503,
            detail="Distribution-shift service is unavailable; no result was fabricated")
    return result
