"""
Migration / Seed script: Loads existing static JSON data from frontend/src/data/
and populates the PostgreSQL database with proper ORM models and bcrypt password hashes.
"""

from __future__ import annotations
import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.base import Base
from sqlalchemy import select
from app.db.session import engine, async_session_factory
from app.db.models.user import User
from app.db.models.assessment import Assessment
from app.db.models.asset import Asset
from app.db.models.reference import Reference
from app.core.security import hash_password
from app.core.logging import get_logger, setup_logging

logger = get_logger(__name__)

FRONTEND_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "data"


def parse_iso(dt_str: str | None) -> datetime | None:
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)


async def seed_all():
    setup_logging()
    logger.info("Connecting to database and creating tables...")

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized.")

    async with async_session_factory() as session:
        # 1. Seed Users
        users_file = FRONTEND_DATA_DIR / "users.json"
        if users_file.exists():
            with open(users_file, "r") as f:
                users_data = json.load(f)

            logger.info("Seeding %d users from %s...", len(users_data), users_file.name)
            for u in users_data:
                existing = await session.execute(select(User).where(User.id == u["id"]))
                if not existing.scalar_one_or_none():
                    user = User(
                        id=u["id"],
                        name=u["name"],
                        email=u["email"],
                        password_hash=hash_password(u["password"]),
                        role=u["role"],
                        status=u.get("status", "active"),
                    )
                    session.add(user)
            await session.commit()
            logger.info("Users seeded successfully.")

        # 2. Seed Assessments
        assessments_file = FRONTEND_DATA_DIR / "assessments.json"
        if assessments_file.exists():
            with open(assessments_file, "r") as f:
                asm_data = json.load(f)

            logger.info("Seeding %d assessments...", len(asm_data))
            for a in asm_data:
                existing = await session.execute(select(Assessment).where(Assessment.id == a["id"]))
                if not existing.scalar_one_or_none():
                    proc = a.get("processing", {})
                    asm = Assessment(
                        id=a["id"],
                        name=a["name"],
                        contributor_id=a["contributorId"],
                        use_case=a.get("useCase", "Computer Vision Assurance"),
                        task=a.get("task", "Object Detection"),
                        status=a.get("status", "submitted"),
                        overall_risk=a.get("overallRisk"),
                        confidence=float(a.get("confidence", 0)),
                        created_at=parse_iso(a.get("createdAt")) or datetime.now(timezone.utc),
                        processing_status=proc.get("status"),
                        processing_progress=float(proc.get("progress", 0)),
                        processing_current_step=proc.get("currentStep"),
                        processing_started_at=parse_iso(proc.get("startedAt")),
                        processing_completed_at=parse_iso(proc.get("completedAt")),
                    )
                    session.add(asm)
            await session.commit()
            logger.info("Assessments seeded successfully.")

        # 3. Seed Assets
        assets_file = FRONTEND_DATA_DIR / "assets.json"
        if assets_file.exists():
            with open(assets_file, "r") as f:
                assets_data = json.load(f)

            logger.info("Seeding %d assets...", len(assets_data))
            for ast in assets_data:
                existing = await session.execute(select(Asset).where(Asset.id == ast["id"]))
                if not existing.scalar_one_or_none():
                    asset = Asset(
                        id=ast["id"],
                        assessment_id=ast["assessmentId"],
                        type=ast["type"],
                        name=ast["name"],
                        format=ast["format"],
                        size=ast.get("size", "0 MB"),
                        sha256=ast["sha256"],
                        status=ast.get("status", "submitted"),
                        uploaded_at=parse_iso(ast.get("uploadedAt")) or datetime.now(timezone.utc),
                    )
                    session.add(asset)
            await session.commit()
            logger.info("Assets seeded successfully.")

        # 4. Seed References
        refs_file = FRONTEND_DATA_DIR / "references.json"
        if refs_file.exists():
            with open(refs_file, "r") as f:
                refs_data = json.load(f)

            logger.info("Seeding %d references...", len(refs_data))
            for r in refs_data:
                existing = await session.execute(select(Reference).where(Reference.id == r["id"]))
                if not existing.scalar_one_or_none():
                    ref = Reference(
                        id=r["id"],
                        name=r["name"],
                        type=r.get("type", "dataset"),
                        status=r.get("status", "active"),
                        task=r.get("task", "Object Detection"),
                        format=r.get("format", "COCO"),
                        description=r.get("description", ""),
                        compatibility_json=json.dumps(r.get("compatibility", {})),
                        source=r.get("source", "Standard Benchmark"),
                        registered_by=r.get("registeredBy", "System"),
                        registered_at=parse_iso(r.get("registeredAt")) or datetime.now(timezone.utc),
                        metadata_json=json.dumps(r.get("metadata", {})),
                    )
                    session.add(ref)
            await session.commit()
            logger.info("References seeded successfully.")

    logger.info("✅ All seed data migrated into PostgreSQL successfully!")


if __name__ == "__main__":
    asyncio.run(seed_all())
