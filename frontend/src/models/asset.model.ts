export type AssetType = "dataset" | "model" | "inference";

export interface Asset {
  id: string;
  assessmentId: string;
  type: AssetType;
  name: string;
  format: string;
  size: string;
  sha256: string;
  status: "submitted" | "verified" | "flagged";
  uploadedAt: string;
}
