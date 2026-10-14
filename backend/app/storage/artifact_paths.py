"""Storage path resolver utilities."""

from pathlib import Path
from app.config import get_settings


def get_upload_path(filename: str) -> Path:
    return get_settings().UPLOAD_DIR / filename


def get_model_path(filename: str) -> Path:
    return get_settings().MODEL_DIR / filename


def get_report_path(filename: str) -> Path:
    return get_settings().REPORT_DIR / filename


def get_reference_path(filename: str) -> Path:
    return get_settings().REFERENCE_DIR / filename


def get_quarantine_path(filename: str) -> Path:
    return get_settings().QUARANTINE_DIR / filename
