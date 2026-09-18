export interface ReferenceAssignment {
  assessmentId: string;
  assetId: string;
  referenceId?: string;
  status: "assigned" | "without_reference" | "reference_requested";
  assignedBy: string;
  assignedAt: string;
  note?: string;
}
