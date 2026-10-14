"""Audit event logging service."""

import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories.audit_repository import AuditRepository
from app.db.models.audit_event import AuditEvent


class AuditService:
    def __init__(self, session: AsyncSession):
        self.repo = AuditRepository(session)

    async def log_action(self, entity_type: str, entity_id: str, action: str, actor_id: str | None = None, details: dict | None = None) -> AuditEvent:
        event = AuditEvent(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            actor_id=actor_id,
            details_json=json.dumps(details or {}),
        )
        return await self.repo.create(event)
