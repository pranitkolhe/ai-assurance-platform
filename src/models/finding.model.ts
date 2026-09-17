export type Severity = "low" | "medium" | "high" | "critical";

export interface Finding {
  id: string;
  assessmentId: string;
  assetId: string;
  type: string;
  title: string;
  description: string;
  severity: Severity;
  confidence: number;
  status: "open" | "reviewed" | "resolved";
  affectedSamples: number;
  detectionMethod: string;
}
