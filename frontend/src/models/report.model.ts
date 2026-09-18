export interface Report {
  id: string;
  assessmentId: string;
  generatedAt: string;
  overallRisk: "low" | "medium" | "high";
  confidence: number;
  recommendation: "accept" | "review" | "quarantine";
  analystDecision?: "accept" | "review" | "quarantine";
}
