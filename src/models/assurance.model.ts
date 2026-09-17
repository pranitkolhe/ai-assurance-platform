export type AssuranceDomain =
  | "data_integrity"
  | "model_integrity"
  | "inference_verification"
  | "distribution_analysis";

export type AssuranceSeverity = "low" | "medium" | "high" | "critical";

export type AssuranceDisposition = "accept" | "review" | "quarantine";

export interface AssuranceMetric {
  id: string;
  name: string;
  value: number;
  unit?: string;
  status: "pass" | "warning" | "fail";
  description: string;
}

export interface AssuranceFinding {
  id: string;
  title: string;
  description: string;
  severity: AssuranceSeverity;
  confidence: number;
  affectedSamples: number;
  detectionMethod: string;
}

export interface AssuranceDomainResult {
  domain: AssuranceDomain;
  score: number;
  confidence: number;
  status: "pass" | "warning" | "fail";
  summary: string;
  metrics: AssuranceMetric[];
  findings: AssuranceFinding[];
}

export interface AssuranceResult {
  assessmentId: string;
  generatedAt: string;
  overallRisk: "low" | "medium" | "high";
  overallConfidence: number;
  recommendation: AssuranceDisposition;
  domains: AssuranceDomainResult[];
}
