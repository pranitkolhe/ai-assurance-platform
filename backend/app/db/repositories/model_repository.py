"""Model artifact repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.model_artifact import ModelArtifact


class ModelRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_asset_id(self, asset_id: str) -> ModelArtifact | None:
        res = await self.session.execute(select(ModelArtifact).where(ModelArtifact.asset_id == asset_id))
        return res.scalar_one_or_none()

    async def create(self, artifact: ModelArtifact) -> ModelArtifact:
        self.session.add(artifact)
        await self.session.commit()
        await self.session.refresh(artifact)
        return artifact
