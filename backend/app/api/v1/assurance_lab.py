"""Assurance lab testing endpoints.

This aggregates the live engine services for an assessment's assets
-- it contains no analysis logic and no hard-coded scores.

For each asset with a stored file path it calls the matching service:
  dataset -> data_integrity (and distribution_shift)
  model   -> model_integrity (and backdoor_assessment)
Domains whose service is unavailable are omitted from the result
(rather than shown as a pass). If no domain is available at all,
this returns HTTP 503.

Overall risk / recommendation are computed from the available
 domains only: quarantine if any domain is quarantine, review if
any domain is review, otherwise accept. Confidence is the mean of
the available domains' confidences.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies import get_current_user
from app.db.models.user import User
from app.db.repositories.assessment_repository import AssessmentRepository
from app.db.repositories.asset_repository import AssetRepository
from app.engines.dataset_integrity.service import DatasetIntegrityService
from app.engines.model_integrity.service import ModelIntegrityService
from app.engines.backdoor_assessment.service import BackdoorAssessmentService
from app.engines.distribution_shift.service import DistributionShiftService
from app.schemas.assurance import AssuranceResultResponse, AssuranceDomainResult, AssuranceMetric, AssuranceFinding
from app.core.enums import AssessmentRisk, AssuranceDomain, MetricStatus, ReportRecommendation, Severity

router = APIRouter(prefix="/assurance-lab", tags=["assurance-lab"])

_STATUS_TO_METRIC = {
    "pass": MetricStatus.PASS,
    "review": MetricStatus.WARNING,
    "quarantine": MetricStatus.FAIL,
}


def _domain_result(domain: AssuranceDomain, result: dict) -> AssuranceDomainResult:
    findings = []
    for finding in result.get("findings", []):
        severity = str(finding.get("severity", "medium")).lower()
        if severity not in ("low", "medium", "high", "critical"):
            severity = "medium"
        findings.append(AssuranceFinding(
            id=str(finding.get("id", "")),
            title=str(finding.get("title", "")),
            description=str(finding.get("reason", "")),
            severity=Severity(severity),
            confidence=float(result.get("confidence", 0.0)),
            affected_samples=len(finding.get("affected_assets", [])),
            affected_assets=[str(a) for a in finding.get("affected_assets", [])],
            detection_method=domain.value,
        ))
    return AssuranceDomainResult(
        domain=domain,
        score=float(result.get("score", 0.0)),
        confidence=float(result.get("confidence", 0.0)),
        status=_STATUS_TO_METRIC.get(str(result.get("status", "")), MetricStatus.WARNING),
        summary="; ".join(f.get("title", "") for f in result.get("findings", [])) or domain.value,
        metrics=[AssuranceMetric(
            id="score", name="Domain score", value=float(result.get("score", 0.0)),
            status=_STATUS_TO_METRIC.get(str(result.get("status", "")), MetricStatus.WARNING),
            description="Score returned by the standalone engine service.",
        )],
        findings=findings,
    )


@router.get("/{assessment_id}/results", response_model=AssuranceResultResponse)
async def get_assurance_results(assessment_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    assessment_repo = AssessmentRepository(db)
    assessment = await assessment_repo.get_by_id(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    asset_repo = AssetRepository(db)
    assets = await asset_repo.get_by_assessment(assessment_id)
    domains: list[AssuranceDomainResult] = []
    for asset in assets:
        if not asset.file_path:
            continue
        if asset.type == "dataset":
            data = await DatasetIntegrityService().analyze(asset.file_path, asset.format)
            if data.get("status") != "unavailable":
                domains.append(_domain_result(AssuranceDomain.DATA_INTEGRITY, data))
            shift = await DistributionShiftService().analyze(asset.file_path)
            if shift.get("status") != "unavailable":
                domains.append(_domain_result(AssuranceDomain.DISTRIBUTION_ANALYSIS, shift))
        elif asset.type == "model":
            model = await ModelIntegrityService().analyze(asset.file_path, asset.format)
            if model.get("status") != "unavailable":
                domains.append(_domain_result(AssuranceDomain.MODEL_INTEGRITY, model))
            backdoor = await BackdoorAssessmentService().analyze(asset.file_path)
            if backdoor.get("status") != "unavailable":
                # Backdoor is reported under the model-integrity domain
                # in the frontend model (there is no separate backdoor
                # domain in AssuranceDomain); its findings are merged
                # into the model domain by appending a second domain
                # entry only if no model domain was already added.
                if not any(d.domain == AssuranceDomain.MODEL_INTEGRITY for d in domains):
                    domains.append(_domain_result(AssuranceDomain.MODEL_INTEGRITY, backdoor))
    if not domains:
        raise HTTPException(
            status_code=503,
            detail="No engine service returned a result for this assessment; "
                   "no assurance result was fabricated. Start the services "
                   "(see services/README.md) and retry.")
    statuses = [d.status for d in domains]
    if MetricStatus.FAIL in statuses:
        risk, recommendation = AssessmentRisk.HIGH, ReportRecommendation.QUARANTINE
    elif MetricStatus.WARNING in statuses:
        risk, recommendation = AssessmentRisk.MEDIUM, ReportRecommendation.REVIEW
    else:
        risk, recommendation = AssessmentRisk.LOW, ReportRecommendation.ACCEPT
    confidence = sum(d.confidence for d in domains) / len(domains)
    return AssuranceResultResponse(
        assessment_id=assessment_id,
        generated_at=datetime.now(timezone.utc),
        overall_risk=risk,
        overall_confidence=round(confidence, 4),
        recommendation=recommendation,
        domains=domains,
    )
