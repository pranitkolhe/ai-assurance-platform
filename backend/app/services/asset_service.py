"""Asset domain business logic."""

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories.asset_repository import AssetRepository
from app.db.models.asset import Asset


class AssetService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = AssetRepository(session)

    async def register_asset(self, assessment_id: str, asset_type: str, name: str, format_name: str, size: str, sha256: str) -> Asset:
        asset = Asset(
            assessment_id=assessment_id,
            type=asset_type,
            name=name,
            format=format_name,
            size=size,
            sha256=sha256,
            status="submitted",
        )
        return await self.repo.create(asset)
