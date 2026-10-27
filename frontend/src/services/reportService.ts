import { apiRequest, ApiError } from "../api/client";

/**
 * Live assurance report, fetched from the backend assurance-lab
 * aggregation (GET /assurance-lab/{id}/results), which in turn
 * calls the standalone engine services.
 *
 * This deliberately does NOT use GET /reports/{id}: that backend
 * endpoint still returns a hard-coded LOW / 0.95 / ACCEPT for
 * every assessment (Phase 5 work), so using it here would show
 * a fake report. The assurance-lab result is the real one.
 *
 * Score / confidence units: the backend returns 0–1 floats, the
 * legacy local results stored 0–100. This service normalises
 * both to a 0–100 percent for display.
 */

export type ReportDomainStatus = "pass" | "warning" | "fail";

export interface ReportFinding {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  affectedSamples: number;
  detectionMethod: string;
}

export interface ReportDomain {
  domain: string;
  score: number;
  confidence: number;
  status: ReportDomainStatus;
  summary: string;
  findings: ReportFinding[];
}

export interface LiveReport {
  assessmentId: string;
  generatedAt: string;
  overallRisk: "low" | "medium" | "high";
  overallConfidence: number;
  recommendation: "accept" | "review" | "quarantine";
  domains: ReportDomain[];
}

function toPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 1) return Math.round(value * 100);
  return Math.round(value);
}

function toSeverity(value: unknown): ReportFinding["severity"] {
  const v = String(value || "medium").toLowerCase();
  if (v === "low" || v === "medium" || v === "high" || v === "critical") {
    return v;
  }
  return "medium";
}

export function domainLabel(domain: string): string {
  switch (domain) {
    case "data_integrity":
      return "Data Integrity";
    case "model_integrity":
      return "Model Integrity";
    case "inference_verification":
      return "Inference Verification";
    case "distribution_analysis":
      return "Distribution Analysis";
    default:
      return domain.replace(/_/g, " ");
  }
}

export async function fetchLiveReport(
  assessmentId: string,
): Promise<LiveReport> {
  const raw = await apiRequest<any>(`/assurance-lab/${assessmentId}/results`);
  const domains: ReportDomain[] = (raw.domains || []).map((d: any) => ({
    domain: String(d.domain || ""),
    score: toPercent(Number(d.score ?? 0)),
    confidence: toPercent(Number(d.confidence ?? 0)),
    status: (String(d.status || "warning") as ReportDomainStatus),
    summary: String(d.summary || ""),
    findings: (d.findings || []).map((f: any, idx: number) => ({
      id: String(f.id || `${d.domain}-${idx}`),
      title: String(f.title || "Finding"),
      description: String(f.description || ""),
      severity: toSeverity(f.severity),
      confidence: toPercent(Number(f.confidence ?? 0)),
      affectedSamples: Number(f.affectedSamples ?? f.affected_samples ?? 0),
      detectionMethod: String(f.detectionMethod || f.detection_method || ""),
    })),
  }));
  return {
    assessmentId: String(raw.assessmentId || raw.assessment_id || assessmentId),
    generatedAt: String(raw.generatedAt || raw.generated_at || ""),
    overallRisk: String(raw.overallRisk || raw.overall_risk || "medium") as LiveReport["overallRisk"],
    overallConfidence: toPercent(Number(raw.overallConfidence ?? raw.overall_confidence ?? 0)),
    recommendation: String(raw.recommendation || "review") as LiveReport["recommendation"],
    domains,
  };
}

export { ApiError };
