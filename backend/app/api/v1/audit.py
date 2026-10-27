"""Audit event log endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.db.models.user import User
from app.db.repositories.audit_repository import AuditRepository
from app.db.models.audit_event import AuditEvent

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("")
@router.get("/")
async def list_audit_logs(limit: int = 50, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = AuditRepository(db)
    events = await repo.get_all(limit=limit)
    return [
        {
            "id": e.id,
            "entity_type": e.entity_type,
            "entity_id": e.entity_id,
            "action": e.action,
            "actor_id": e.actor_id,
            "timestamp": e.timestamp.isoformat(),
        }
        for e in events
    ]
