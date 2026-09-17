import type { AssuranceDomain } from "./assurance.model";
import type { Severity } from "./finding.model";

export type FlaggedImageStatus = "open" | "reviewed" | "resolved";

export interface FlaggedImage {
  id: string;
  assessmentId: string;
  assetId: string;
  findingId: string;
  domain: AssuranceDomain;
  imageName: string;
  imagePath: string;
  findingTitle: string;
  description: string;
  severity: Severity;
  confidence: number;
  detectionMethod: string;
  status: FlaggedImageStatus;
  expectedLabel?: string;
  observedLabel?: string;
}
