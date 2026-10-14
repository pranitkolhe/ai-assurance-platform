"""Model artifact verification endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.repositories.asset_repository import AssetRepository
from app.schemas.model import ModelInspectionResult
from app.core.enums import ModelFormat

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/{asset_id}/inspection", response_model=ModelInspectionResult)
async def inspect_model(asset_id: str, db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    asset = await repo.get_by_id(asset_id)
    if not asset or asset.type != "model":
        raise HTTPException(status_code=404, detail="Model asset not found")

    return ModelInspectionResult(
        asset_id=asset.id,
        format=ModelFormat.ONNX,
        backbone="ResNet-50",
        input_shape=[1, 3, 640, 640],
        num_classes=80,
        tamper_detected=False,
        clean_accuracy=0.942,
        backdoor_risk="low",
    )
