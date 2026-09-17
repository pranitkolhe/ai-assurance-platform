import type { ProcessingState } from './processing.model'

export type AssessmentStatus =
  | 'draft'
  | 'submitted'
  | 'registered'
  | 'analysis'
  | 'review'
  | 'completed'

export type AssessmentRisk =
  | 'low'
  | 'medium'
  | 'high'

export interface Assessment {
  id: string
  name: string
  contributorId: string
  contributorName: string
  useCase: string
  task: string
  status: AssessmentStatus
  overallRisk: AssessmentRisk
  confidence: number
  createdAt: string
  processing?: ProcessingState
}
