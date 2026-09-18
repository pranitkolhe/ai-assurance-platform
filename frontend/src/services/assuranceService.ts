import assuranceResults from "../data/assurance-results.json";
import type { AssuranceResult } from "../models/assurance.model";

const results = assuranceResults as AssuranceResult[];

export function getAssuranceResults(): AssuranceResult[] {
  return results;
}

export function getAssuranceResult(
  assessmentId: string,
): AssuranceResult | undefined {
  return results.find((result) => result.assessmentId === assessmentId);
}

export function getAssuranceResultByAssessmentId(
  assessmentId: string,
): AssuranceResult | undefined {
  return getAssuranceResult(assessmentId);
}

export function loadAssuranceResult(
  assessmentId: string,
): AssuranceResult | undefined {
  return getAssuranceResult(assessmentId);
}
