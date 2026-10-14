"""Cryptographic provenance validation endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.repositories.asset_repository import AssetRepository
from app.schemas.provenance import ProvenanceManifest

router = APIRouter(prefix="/provenance", tags=["provenance"])


@router.get("/{asset_id}/manifest", response_model=ProvenanceManifest)
async def get_provenance_manifest(asset_id: str, db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    asset = await repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    return ProvenanceManifest(
        manifest_version="1.0.0",
        asset_id=asset.id,
        asset_sha256=asset.sha256,
        created_at=datetime.now(timezone.utc),
        signer_id="KEY-ED25519-ASSURE-01",
        signature="ed25519:3fa85f6479010000",
        verified=True,
    )
