"""Health check endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["system"])


@router.get("/")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "AI Assurance Platform API",
    }
