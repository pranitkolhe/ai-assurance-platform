import { apiRequest } from "../api/client";
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
  assuranceSummary: {
    dataIntegrity: 100,
    modelIntegrity: 100,
    inferenceVerification: 100,
    distributionAnalysis: 100,
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
        dataIntegrity: summary.dataIntegrity ?? summary.data_integrity ?? 100,
        modelIntegrity: summary.modelIntegrity ?? summary.model_integrity ?? 100,
        inferenceVerification: summary.inferenceVerification ?? summary.inference_verification ?? 100,
        distributionAnalysis: summary.distributionAnalysis ?? summary.distribution_analysis ?? 100,
      },
    };
    cachedDashboard = data;
    return data;
  } catch {
    return cachedDashboard;
  }
}

export function getAnalystDashboard(): AnalystDashboardData {
  return cachedDashboard;
}
