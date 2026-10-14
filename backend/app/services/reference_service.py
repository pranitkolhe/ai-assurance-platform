"""Reference standard repository service."""

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories.reference_repository import ReferenceRepository


class ReferenceService:
    def __init__(self, session: AsyncSession):
        self.repo = ReferenceRepository(session)
