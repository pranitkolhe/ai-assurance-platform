export type ProcessingStatus =
  | "submitted"
  | "registering"
  | "queued"
  | "reference_assignment"
  | "processing"
  | "analysis_complete"
  | "completed"
  | "failed";

export interface ProcessingState {
  status: ProcessingStatus;
  progress: number;
  currentStep: string;
  startedAt?: string;
  completedAt?: string;
}
