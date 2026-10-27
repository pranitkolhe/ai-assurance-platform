"""Reset the whole database, keeping ONLY users.

Run from the backend folder, with the backend venv active:
    cd backend
    python scripts/reset_demo_data.py --confirm

What it deletes, in foreign-key-safe order (every table except
users):
    flagged_images, evidence, findings, inference_records,
    assurance_results, reports, risk_decisions, analysis_runs,
    audit_events, dataset_artifacts, model_artifacts,
    reference_assignments, assets, assessments,
    references, reference_profiles, signing_keys

What it KEEPS:
    users only (admin / contributor / analyst logins stay working).
    The alembic_version row is also kept: it is schema-migration
    metadata, not data, and deleting it would break migrations.

Note on the 404 in the backend log (GET /datasets/<id>/integrity
404): that is the correct result after a clean -- the asset id no
longer exists in the database, so there is nothing to analyse.
It is not a bug in the live check.

It does NOT delete uploaded files on disk. After running it, also
clear the browser: log out (which now clears all assure_* local
storage) or run localStorage.clear() in the browser console, then
reload. Otherwise stale local results will reappear on the pages.

This is destructive and cannot be undone. The --confirm flag is
required on purpose.
"""

import argparse
import asyncio
import sys
from pathlib import Path

# When run as `python scripts/reset_demo_data.py` from the backend
# folder, Python puts scripts/ (not backend/) on sys.path, so the
# `app` package is not importable. Add backend/ explicitly, so the
# script works from any working directory without PYTHONPATH.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import delete, func, select

from app.db.models import (
    AnalysisRun,
    Assessment,
    Asset,
    AssuranceResult,
    AuditEvent,
    DatasetArtifact,
    Evidence,
    Finding,
    FlaggedImage,
    InferenceRecord,
    ModelArtifact,
    Reference,
    ReferenceAssignment,
    ReferenceProfile,
    Report,
    RiskDecision,
    SigningKey,
    User,
)
from app.db.session import async_session_factory

# Child tables first, parents last. Reference assignments must go
# before references, assets and assessments (they reference all
# three); references and profiles go last among the deleted tables.
TABLES_IN_ORDER = [
    FlaggedImage,
    Evidence,
    Finding,
    InferenceRecord,
    AssuranceResult,
    Report,
    RiskDecision,
    AnalysisRun,
    AuditEvent,
    DatasetArtifact,
    ModelArtifact,
    ReferenceAssignment,
    Asset,
    Assessment,
    Reference,
    ReferenceProfile,
    SigningKey,
]


async def main() -> int:
    parser = argparse.ArgumentParser(description="Reset database, keep only users.")
    parser.add_argument("--confirm", action="store_true", help="Required: confirm the destructive reset.")
    args = parser.parse_args()
    if not args.confirm:
        print("Refusing to run without --confirm. This deletes everything except users.")
        print("Run: python scripts/reset_demo_data.py --confirm")
        return 2
    async with async_session_factory() as session:
        users_before = (await session.execute(select(func.count()).select_from(User))).scalar() or 0
        print(f"Users before reset: {users_before}")
        for model in TABLES_IN_ORDER:
            result = await session.execute(delete(model))
            print(f"  {model.__tablename__}: deleted {result.rowcount}")
        await session.commit()
        users_after = (await session.execute(select(func.count()).select_from(User))).scalar() or 0
        print(f"Users after reset: {users_after} (must equal before)")
        failed = []
        for model in TABLES_IN_ORDER:
            remaining = (await session.execute(select(func.count()).select_from(model))).scalar() or 0
            print(f"  {model.__tablename__} remaining: {remaining}")
            if remaining != 0:
                failed.append(model.__tablename__)
        if users_after != users_before or failed:
            print(f"ERROR: reset incomplete. Users changed or tables not empty: {failed}")
            return 1
    print("Reset complete: only users remain. Restart the backend, log out / log in again, and re-upload from the contributor side.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
