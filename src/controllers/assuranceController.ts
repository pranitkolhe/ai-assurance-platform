import {
  getAssuranceResultByAssessmentId,
  getAssuranceResults,
} from "../services/assuranceService";

export function loadAssuranceResults() {
  return getAssuranceResults();
}

export function loadAssuranceResult(assessmentId: string) {
  return getAssuranceResultByAssessmentId(assessmentId);
}
