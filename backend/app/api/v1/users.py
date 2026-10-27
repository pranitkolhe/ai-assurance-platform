"""User management endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse
from app.dependencies import require_role

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(require_role(["admin"]))])


@router.get("", response_model=list[UserResponse])
@router.get("/", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    users = await repo.get_all()
    return [UserResponse.model_validate(u) for u in users]
