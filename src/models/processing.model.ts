export type ProcessingStatus =
  | 'submitted'
  | 'registering'
  | 'queued'
  | 'processing'
  | 'analysis_complete'
  | 'analyst_review'
  | 'completed'
  | 'failed'

export interface ProcessingState {
  status: ProcessingStatus
  progress: number
  currentStep: string
  startedAt?: string
  completedAt?: string
}
