"""Application domain exceptions and handlers."""

from __future__ import annotations
from typing import Any
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class AppException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, error_code: str | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or "APP_ERROR"


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND, error_code="NOT_FOUND")


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request"):
        super().__init__(message=message, status_code=status.HTTP_400_BAD_REQUEST, error_code="BAD_REQUEST")


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED, error_code="UNAUTHORIZED")


class ForbiddenException(AppException):
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN, error_code="FORBIDDEN")


class ConflictException(AppException):
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT, error_code="CONFLICT")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "error_code": exc.error_code},
        )
