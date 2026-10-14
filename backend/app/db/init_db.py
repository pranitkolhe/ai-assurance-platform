"""Database schema initialization and seed data."""

import json
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import Base
from app.db.session import engine, async_session_factory
from app.db.models.user import User
from app.core.security import hash_password
from app.core.logging import get_logger

logger = get_logger(__name__)


async def init_db() -> None:
    """Create all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized successfully.")


async def seed_users(session: AsyncSession) -> None:
    """Seed default users if not present."""
    from sqlalchemy import select
    res = await session.execute(select(User))
    if res.scalars().first():
        return

    users_data = [
        {"id": "USR-001", "name": "System Admin", "email": "admin@assure.local", "password": "admin123", "role": "admin", "status": "active"},
        {"id": "USR-002", "name": "Team Alpha", "email": "contributor@assure.local", "password": "contributor123", "role": "contributor", "status": "active"},
        {"id": "USR-003", "name": "Assurance Analyst", "email": "analyst@assure.local", "password": "analyst123", "role": "analyst", "status": "active"},
    ]
    for u in users_data:
        user = User(
            id=u["id"],
            name=u["name"],
            email=u["email"],
            password_hash=hash_password(u["password"]),
            role=u["role"],
            status=u["status"],
        )
        session.add(user)
    await session.commit()
    logger.info("Default seed users created.")
