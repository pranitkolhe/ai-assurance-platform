import { apiRequest, ApiError } from "../api/client";
import type { AnalystDashboardData } from "../models/dashboard.model";

const DEFAULT_DASHBOARD: AnalystDashboardData = {
  stats: [
    { label: "Active Assessments", value: 0, description: "Currently under analysis" },
    { label: "Total Assessments", value: 0, description: "Total registered in database" },
    { label: "Open Findings", value: 0, description: "Unresolved issues across assets" },
    { label: "Verified Artifacts", value: 0, description: "Verified datasets & models" },
  ],
  queue: [],
  findings: [],
  // Honest defaults: 0, not 100. The backend dashboard summary is
  // 0 until Phase 5 backs it with engine results (see backend
  // dashboard.py). Showing 100 on a failed fetch was fake data.
  assuranceSummary: {
    dataIntegrity: 0,
    modelIntegrity: 0,
    inferenceVerification: 0,
    distributionAnalysis: 0,
  },
};

let cachedDashboard: AnalystDashboardData = DEFAULT_DASHBOARD;

export async function fetchAnalystDashboard(): Promise<AnalystDashboardData> {
  try {
    const res = await apiRequest<any>("/dashboard/analyst");
    const summary = res.assuranceSummary || res.assurance_summary || DEFAULT_DASHBOARD.assuranceSummary;
    const data: AnalystDashboardData = {
      stats: res.stats || DEFAULT_DASHBOARD.stats,
      queue: (res.queue || []).map((q: any) => ({
        id: q.id,
        name: q.name,
        contributor: q.contributor,
        assets: q.assets,
        risk: q.risk,
        confidence: q.confidence,
        status: q.status,
        updatedAt: q.updatedAt || q.updated_at || "",
      })),
      findings: (res.findings || []).map((f: any) => ({
        id: f.id,
        title: f.title,
        type: f.type,
        severity: f.severity,
        confidence: f.confidence,
        asset: f.asset,
        assessmentId: f.assessmentId || f.assessment_id || "",
      })),
      assuranceSummary: {
        dataIntegrity: summary.dataIntegrity ?? summary.data_integrity ?? 0,
        modelIntegrity: summary.modelIntegrity ?? summary.model_integrity ?? 0,
        inferenceVerification: summary.inferenceVerification ?? summary.inference_verification ?? 0,
        distributionAnalysis: summary.distributionAnalysis ?? summary.distribution_analysis ?? 0,
      },
    };
    cachedDashboard = data;
    return data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      throw err;
    }
    return cachedDashboard;
  }
}

export function getAnalystDashboard(): AnalystDashboardData {
  return cachedDashboard;
}
