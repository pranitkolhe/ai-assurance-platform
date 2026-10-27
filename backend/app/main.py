"""FastAPI application entrypoint."""

from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.db.init_db import init_db, seed_users
from app.db.session import async_session_factory
from app.api.router import api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    setup_logging(level=logging.DEBUG if settings.DEBUG else logging.INFO)
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)

    # Ensure storage paths exist
    for d in settings.data_dirs:
        d.mkdir(parents=True, exist_ok=True)

    # Initialize SQLite/Postgres tables
    await init_db()
    # DB-switch fix (2026-10-27): init_db() only creates tables, it
    # does NOT create users. So switching DATABASE_URL to a fresh
    # database (e.g. prod_assurance_dev) left the users table
    # empty and every login returned 401, even with the correct
    # password. seed_users() only inserts the 3 default accounts
    # when the users table is empty, so it is safe to run on every
    # startup: existing users are never overwritten or duplicated.
    async with async_session_factory() as session:
        await seed_users(session)
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/", tags=["system"])
    async def root():
        return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"}

    return app


app = create_app()
