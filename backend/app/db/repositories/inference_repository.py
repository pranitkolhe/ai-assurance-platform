"""Inference record repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.inference_record import InferenceRecord


class InferenceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_assessment(self, assessment_id: str) -> list[InferenceRecord]:
        res = await self.session.execute(select(InferenceRecord).where(InferenceRecord.assessment_id == assessment_id))
        return list(res.scalars().all())

    async def create(self, record: InferenceRecord) -> InferenceRecord:
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return record
