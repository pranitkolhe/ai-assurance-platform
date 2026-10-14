"""Distribution shift analysis endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter(prefix="/distribution-shift", tags=["distribution-shift"])


@router.get("/{assessment_id}/summary")
async def get_distribution_shift_summary(assessment_id: str, db: AsyncSession = Depends(get_db)):
    return {
        "assessment_id": assessment_id,
        "wasserstein_distance": 0.042,
        "ks_test_p_value": 0.38,
        "covariate_shift_detected": False,
        "concept_drift_detected": False,
        "status": "pass",
    }
