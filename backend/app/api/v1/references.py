"""Reference repository standard library endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.db.models.reference import Reference
from app.db.models.user import User
from app.db.repositories.reference_repository import ReferenceRepository
from app.schemas.reference import ReferenceCreate, ReferenceResponse

router = APIRouter(prefix="/references", tags=["references"])


@router.get("", response_model=list[ReferenceResponse])
@router.get("/", response_model=list[ReferenceResponse])
async def list_references(type: str | None = None, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = ReferenceRepository(db)
    refs = await repo.get_all(ref_type=type)
    return [
        ReferenceResponse(
            id=r.id,
            name=r.name,
            type=r.type,
            status=r.status,
            task=r.task,
            format=r.format,
            description=r.description,
            source=r.source,
            registered_by=r.registered_by,
            registered_at=r.registered_at,
        )
        for r in refs
    ]


@router.post("", response_model=ReferenceResponse)
@router.post("/", response_model=ReferenceResponse)
async def create_reference(payload: ReferenceCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = ReferenceRepository(db)
    ref = Reference(
        name=payload.name,
        type=payload.type.value,
        status=payload.status.value,
        task=payload.task,
        format=payload.format,
        description=payload.description,
        source=payload.source,
        registered_by=payload.registered_by,
    )
    saved = await repo.create(ref)
    return ReferenceResponse(
        id=saved.id,
        name=saved.name,
        type=saved.type,
        status=saved.status,
        task=saved.task,
        format=saved.format,
        description=saved.description,
        source=saved.source,
        registered_by=saved.registered_by,
        registered_at=saved.registered_at,
    )
