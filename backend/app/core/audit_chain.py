"""Tamper-evident hash chaining for audit events."""

import hashlib
from typing import Any


def compute_audit_hash(prev_hash: str, event_data: dict[str, Any]) -> str:
    combined = f"{prev_hash}::{sorted(event_data.items())}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()
