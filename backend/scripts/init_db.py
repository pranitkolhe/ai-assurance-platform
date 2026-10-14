"""CLI script to initialize database and seed users."""
import asyncio
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
