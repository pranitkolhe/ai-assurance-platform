"""Finding repository."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.finding import Finding


class FindingRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, finding_id: str) -> Finding | None:
        res = await self.session.execute(select(Finding).where(Finding.id == finding_id))
        return res.scalar_one_or_none()

    async def get_by_assessment(self, assessment_id: str) -> list[Finding]:
        res = await self.session.execute(select(Finding).where(Finding.assessment_id == assessment_id))
        return list(res.scalars().all())

    async def count_by_assessment(self, assessment_id: str) -> int:
        res = await self.session.execute(select(func.count(Finding.id)).where(Finding.assessment_id == assessment_id))
        return res.scalar_one() or 0

    async def create(self, finding: Finding) -> Finding:
        self.session.add(finding)
        await self.session.commit()
        await self.session.refresh(finding)
        return finding
