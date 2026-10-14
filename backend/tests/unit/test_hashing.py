"""Test cryptographic hashing functions."""
from app.core.hashing import compute_sha256

def test_sha256_computation():
    data = b"trustworthy-cv-assurance"
    assert len(compute_sha256(data)) == 64
