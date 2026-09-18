import type { RiskDecision } from '../models/riskDecision.model'

const STORAGE_KEY = 'assure_risk_decisions'

function readDecisions(): RiskDecision[] {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return []
  }

  try {
    const parsed = JSON.parse(stored)

    return Array.isArray(parsed)
      ? (parsed as RiskDecision[])
      : []
  } catch {
    return []
  }
}

function writeDecisions(decisions: RiskDecision[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(decisions),
  )
}

export function getRiskDecisions(): RiskDecision[] {
  return readDecisions()
}

export function getRiskDecision(
  assessmentId: string,
): RiskDecision | undefined {
  return readDecisions().find(
    (decision) =>
      decision.assessmentId === assessmentId,
  )
}

export function saveRiskDecision(
  decision: RiskDecision,
): RiskDecision {
  const decisions = readDecisions()

  const existingIndex = decisions.findIndex(
    (item) =>
      item.assessmentId === decision.assessmentId,
  )

  if (existingIndex >= 0) {
    decisions[existingIndex] = decision
  } else {
    decisions.push(decision)
  }

  writeDecisions(decisions)

  return decision
}

export function deleteRiskDecision(
  assessmentId: string,
): void {
  const decisions = readDecisions().filter(
    (decision) =>
      decision.assessmentId !== assessmentId,
  )

  writeDecisions(decisions)
}
