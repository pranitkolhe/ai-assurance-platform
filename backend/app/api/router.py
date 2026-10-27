"""API router aggregation.

NOTE on evidence / flagged_images: those two router files exist under
app/api/v1/ but are deliberately NOT included here, because they
cannot be imported as written -- they import app.core.auth (which
does not exist; the real dependency is app.dependencies), they import
app.schemas.evidence / app.schemas.flagged_image (which do not exist),
and they import repositories that do not exist
(evidence_repository, flagged_image_repository). Including them
breaks backend startup for everyone. They are listed as a known
issue in the root README; fixing them is a separate backend task,
not an engine-service task, and must not be done by editing the
engine services.
"""

from fastapi import APIRouter
from app.api.v1 import (
    health,
    auth,
    users,
    assessments,
    assets,
    datasets,
    models,
    backdoor,
    engines,
    inferences,
    provenance,
    distribution_shift,
    assurance_lab,
    findings,
    reports,
    audit,
    references,
    dashboard,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(assessments.router)
api_router.include_router(assets.router)
api_router.include_router(datasets.router)
api_router.include_router(models.router)
api_router.include_router(backdoor.router)
api_router.include_router(engines.router)
api_router.include_router(inferences.router)
api_router.include_router(provenance.router)
api_router.include_router(distribution_shift.router)
api_router.include_router(assurance_lab.router)
api_router.include_router(findings.router)
api_router.include_router(reports.router)
api_router.include_router(audit.router)
api_router.include_router(references.router)
api_router.include_router(dashboard.router)
