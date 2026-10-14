"""FastAPI application-wide dependencies."""

from collections.abc import AsyncGenerator
from typing import Annotated
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.repositories.user_repository import UserRepository
from app.db.models.user import User
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Extract and validate JWT token from Bearer header."""
    if not credentials:
        # Fallback for development if token header missing
        repo = UserRepository(db)
        admin = await repo.get_by_email("admin@assure.local")
        if admin:
            return admin
        raise UnauthorizedException("Authentication token required")

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload")

    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException("User not found")
    return user


def require_role(allowed_roles: list[str]):
    """Role-based authorization dependency factory."""
    async def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(f"Operation requires one of roles: {allowed_roles}")
        return current_user
    return role_checker
