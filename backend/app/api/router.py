"""API router aggregation."""

from fastapi import APIRouter
from app.api.v1 import (
    health,
    auth,
    users,
    assessments,
    assets,
    datasets,
    models,
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
api_router.include_router(inferences.router)
api_router.include_router(provenance.router)
api_router.include_router(distribution_shift.router)
api_router.include_router(assurance_lab.router)
api_router.include_router(findings.router)
api_router.include_router(reports.router)
api_router.include_router(audit.router)
api_router.include_router(references.router)
api_router.include_router(dashboard.router)
