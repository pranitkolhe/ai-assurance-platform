"""Reference standard repository."""

import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.reference import Reference


class ReferenceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, ref_id: str) -> Reference | None:
        res = await self.session.execute(select(Reference).where(Reference.id == ref_id))
        return res.scalar_one_or_none()

    async def get_all(self, ref_type: str | None = None) -> list[Reference]:
        stmt = select(Reference)
        if ref_type:
            stmt = stmt.where(Reference.type == ref_type)
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def create(self, ref: Reference) -> Reference:
        self.session.add(ref)
        await self.session.commit()
        await self.session.refresh(ref)
        return ref
