"""Common reusable Pydantic schemas."""

from __future__ import annotations
from typing import Generic, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


class SuccessResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"


class IdResponse(BaseModel):
    id: str


class ErrorResponse(BaseModel):
    detail: str
    error_code: str | None = None
