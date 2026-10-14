"""Asset repository."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.asset import Asset


class AssetRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, asset_id: str) -> Asset | None:
        res = await self.session.execute(select(Asset).where(Asset.id == asset_id))
        return res.scalar_one_or_none()

    async def get_by_assessment(self, assessment_id: str, asset_type: str | None = None) -> list[Asset]:
        stmt = select(Asset).where(Asset.assessment_id == assessment_id)
        if asset_type:
            stmt = stmt.where(Asset.type == asset_type)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_all(self, asset_type: str | None = None) -> list[Asset]:
        stmt = select(Asset)
        if asset_type:
            stmt = stmt.where(Asset.type == asset_type)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def create(self, asset: Asset) -> Asset:
        self.session.add(asset)
        await self.session.commit()
        await self.session.refresh(asset)
        return asset

    async def count_by_assessment(self, assessment_id: str) -> int:
        res = await self.session.execute(select(func.count(Asset.id)).where(Asset.assessment_id == assessment_id))
        return res.scalar_one() or 0
