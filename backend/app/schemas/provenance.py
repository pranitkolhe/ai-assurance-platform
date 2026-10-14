"""Cryptographic provenance and manifest schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ProvenanceManifest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    manifest_version: str = "1.0.0"
    asset_id: str
    asset_sha256: str
    created_at: datetime
    signer_id: str
    signature: str
    verified: bool = True
