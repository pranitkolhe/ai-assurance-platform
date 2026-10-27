"""CLI script to initialize database and seed users."""
import asyncio
import sys
from pathlib import Path

# Same fix as reset_demo_data.py: when run as
# `python scripts/init_db.py`, Python puts scripts/ (not backend/)
# on sys.path, so `app` would not be importable.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.init_db import init_db, seed_users
from app.db.session import async_session_factory

async def main():
    print("Initializing database...")
    await init_db()
    async with async_session_factory() as session:
        await seed_users(session)
    print("Database ready!")

if __name__ == "__main__":
    asyncio.run(main())
