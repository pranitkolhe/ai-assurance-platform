"""User and authentication schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.core.enums import UserRole


class UserBase(BaseModel):
    name: str
    email: str
    role: UserRole = UserRole.CONTRIBUTOR


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    role: UserRole | None = None
    status: str | None = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    status: str
    created_at: datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
