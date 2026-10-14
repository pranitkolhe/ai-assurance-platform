"""Dataset artifact repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.dataset import DatasetArtifact


class DatasetRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_asset_id(self, asset_id: str) -> DatasetArtifact | None:
        res = await self.session.execute(select(DatasetArtifact).where(DatasetArtifact.asset_id == asset_id))
        return res.scalar_one_or_none()

    async def create(self, artifact: DatasetArtifact) -> DatasetArtifact:
        self.session.add(artifact)
        await self.session.commit()
        await self.session.refresh(artifact)
        return artifact
