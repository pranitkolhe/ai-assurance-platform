"""Cryptographic hashing for datasets, models, and evidence integrity."""

import hashlib
from pathlib import Path


def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def compute_file_hash(path: Path | str, chunk_size: int = 65536) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(chunk_size):
            h.update(chunk)
    return h.hexdigest()


def verify_hash(path: Path | str, expected_hash: str) -> bool:
    return compute_file_hash(path).lower() == expected_hash.lower()
