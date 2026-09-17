import assuranceResults from "../data/assurance-results.json";

import type { AssuranceResult } from "../models/assurance.model";

export function getAssuranceResults(): AssuranceResult[] {
  return assuranceResults as AssuranceResult[];
}

export function getAssuranceResultByAssessmentId(
  assessmentId: string,
): AssuranceResult | undefined {
  return getAssuranceResults().find(
    (result) => result.assessmentId === assessmentId,
  );
}
