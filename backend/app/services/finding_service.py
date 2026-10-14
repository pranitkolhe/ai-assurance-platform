"""Finding management service."""

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories.finding_repository import FindingRepository


class FindingService:
    def __init__(self, session: AsyncSession):
        self.repo = FindingRepository(session)
