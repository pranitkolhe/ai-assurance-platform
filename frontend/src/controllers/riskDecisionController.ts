import {
  getRiskDecision,
  getRiskDecisions,
  saveRiskDecision,
} from '../services/riskDecisionService'

import type { RiskDecision } from '../models/riskDecision.model'

export function loadRiskDecisions(): RiskDecision[] {
  return getRiskDecisions()
}

export function loadRiskDecision(
  assessmentId: string,
): RiskDecision | undefined {
  return getRiskDecision(assessmentId)
}

export function recordRiskDecision(
  decision: RiskDecision,
): RiskDecision {
  return saveRiskDecision(decision)
}
