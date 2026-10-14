"""Inference verification endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models.inference_record import InferenceRecord
from app.db.repositories.inference_repository import InferenceRepository
from app.schemas.inference import InferenceRecordCreate, InferenceRecordResponse

router = APIRouter(prefix="/inferences", tags=["inferences"])


@router.get("/", response_model=list[InferenceRecordResponse])
async def list_inferences(assessment_id: str, db: AsyncSession = Depends(get_db)):
    repo = InferenceRepository(db)
    records = await repo.get_by_assessment(assessment_id)
    return [InferenceRecordResponse.model_validate(r) for r in records]


@router.post("/", response_model=InferenceRecordResponse)
async def record_inference(payload: InferenceRecordCreate, db: AsyncSession = Depends(get_db)):
    repo = InferenceRepository(db)
    record = InferenceRecord(**payload.model_dump())
    saved = await repo.create(record)
    return InferenceRecordResponse.model_validate(saved)
