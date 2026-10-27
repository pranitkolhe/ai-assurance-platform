"""Cryptographic provenance validation endpoints.

Thin controller only: it resolves an asset, builds a manifest from
the asset's stored SHA-256 (it does not invent a signature), forwards
it to the standalone provenance service (port 8104), and returns that
service's full verification result.

BREAKING CHANGE vs the old prototype: the old endpoint returned a
hard-coded Ed25519 signature and verified=True for every asset. That
has been removed. If the service is down or not yet implemented, this
returns HTTP 503 instead of a fake verified manifest.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.db.models.user import User
from app.db.repositories.asset_repository import AssetRepository
from app.engines.provenance.service import ProvenanceService

router = APIRouter(prefix="/provenance", tags=["provenance"])


@router.get("/{asset_id}/manifest")
async def get_provenance_manifest(asset_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    repo = AssetRepository(db)
    asset = await repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    # Only what the database actually knows: the asset's stored hash.
    # A real signed manifest (signer, signature, sequence, nonce) must
    # come from the provenance service / a stored inference record --
    # it is not invented here. The service therefore verifies the
    # binding it is given; see services/inference-provenance/README.md.
    manifest = {
        "asset_id": asset.id,
        "asset_sha256": asset.sha256,
    }
    result = await ProvenanceService().verify(manifest, asset.file_path)
    if result.get("status") == "unavailable":
        raise HTTPException(
            status_code=503,
            detail="Provenance service is unavailable; no result was fabricated")
    return result


@router.post("/verify")
async def verify_manifest(payload: dict, current_user: User = Depends(get_current_user)) -> dict:
    """Verify a caller-supplied manifest via the provenance service.

    Body: {"manifest": {...}, "asset_path": "..." (optional)}.
    The manifest must contain the binding fields the service checks
    (see services/inference-provenance/README.md); this route does not
    add or invent any of them.
    """
    manifest = payload.get("manifest")
    if not isinstance(manifest, dict):
        raise HTTPException(status_code=422, detail="A manifest object is required")
    result = await ProvenanceService().verify(manifest, payload.get("asset_path"))
    if result.get("status") == "unavailable":
        raise HTTPException(
            status_code=503,
            detail="Provenance service is unavailable; no result was fabricated")
    return result
