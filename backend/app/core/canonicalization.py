"""Canonical representation serializer for cryptographic signing and manifests."""

import json
from typing import Any


def canonicalize_json(data: dict[str, Any] | list[Any]) -> str:
    """Produces deterministic canonical JSON string."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
