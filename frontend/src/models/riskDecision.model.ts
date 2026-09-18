export type RiskDecisionDisposition =
  | 'accept'
  | 'review'
  | 'quarantine'

export interface RiskDecision {
  assessmentId: string
  disposition: RiskDecisionDisposition
  decidedBy: string
  decidedAt: string
  note?: string
}
