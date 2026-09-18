export interface DashboardStat {
  label: string;
  value: number;
  description: string;
  trend?: string;
}

export interface AssessmentQueueItem {
  id: string;
  name: string;
  contributor: string;
  assets: number;
  risk: "low" | "medium" | "high";
  confidence: number;
  status: "submitted" | "analysis" | "review" | "completed";
  updatedAt: string;
}

export interface RecentFinding {
  id: string;
  title: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  asset: string;
  assessmentId: string;
}

export interface AnalystDashboardData {
  stats: DashboardStat[];
  queue: AssessmentQueueItem[];
  findings: RecentFinding[];
  assuranceSummary: {
    dataIntegrity: number;
    modelIntegrity: number;
    inferenceVerification: number;
    distributionAnalysis: number;
  };
}
