"""Assessment repository."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.db.models.assessment import Assessment


class AssessmentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, assessment_id: str) -> Assessment | None:
        res = await self.session.execute(
            select(Assessment)
            .options(selectinload(Assessment.assets), selectinload(Assessment.contributor))
            .where(Assessment.id == assessment_id)
        )
        return res.scalar_one_or_none()

    async def get_all(self, status: str | None = None, contributor_id: str | None = None) -> list[Assessment]:
        stmt = select(Assessment).options(selectinload(Assessment.contributor))
        if status:
            stmt = stmt.where(Assessment.status == status)
        if contributor_id:
            stmt = stmt.where(Assessment.contributor_id == contributor_id)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def create(self, assessment: Assessment) -> Assessment:
        self.session.add(assessment)
        await self.session.commit()
        await self.session.refresh(assessment)
        return assessment

    async def update(self, assessment: Assessment) -> Assessment:
        await self.session.commit()
        await self.session.refresh(assessment)
        return assessment

    async def delete(self, assessment: Assessment) -> None:
        await self.session.delete(assessment)
        await self.session.commit()
