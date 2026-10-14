"""Audit event repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.audit_event import AuditEvent


class AuditRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self, limit: int = 100) -> list[AuditEvent]:
        res = await self.session.execute(select(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit))
        return list(res.scalars().all())

    async def create(self, event: AuditEvent) -> AuditEvent:
        self.session.add(event)
        await self.session.commit()
        await self.session.refresh(event)
        return event
