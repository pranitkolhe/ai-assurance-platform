"""Risk fusion engine aggregating domain scores."""

from app.core.enums import AssessmentRisk, ReportRecommendation


class RiskFusionService:
    @staticmethod
    def calculate_fused_risk(domain_scores: dict[str, float]) -> tuple[AssessmentRisk, float, ReportRecommendation]:
        """Computes weighted multi-domain risk disposition."""
        avg_score = sum(domain_scores.values()) / max(len(domain_scores), 1)
        if avg_score >= 0.85:
            return AssessmentRisk.LOW, avg_score, ReportRecommendation.ACCEPT
        elif avg_score >= 0.65:
            return AssessmentRisk.MEDIUM, avg_score, ReportRecommendation.REVIEW
        return AssessmentRisk.HIGH, avg_score, ReportRecommendation.QUARANTINE
