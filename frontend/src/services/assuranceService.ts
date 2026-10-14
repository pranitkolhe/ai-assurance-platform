import { apiRequest } from "../api/client";
import type { AssuranceResult } from "../models/assurance.model";

const ASSURANCE_RESULTS_KEY = "assure_results";

function readStoredResults(): AssuranceResult[] {
  const stored = localStorage.getItem(ASSURANCE_RESULTS_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as AssuranceResult[]) : [];
  } catch {
    return [];
  }
}

function writeStoredResults(records: AssuranceResult[]): void {
  localStorage.setItem(ASSURANCE_RESULTS_KEY, JSON.stringify(records));
}

export async function fetchAssuranceResultFromApi(
  assessmentId: string,
): Promise<AssuranceResult | undefined> {
  try {
    const result = await apiRequest<AssuranceResult>(
      `/assurance-lab/${assessmentId}/results`,
    );
    const stored = readStoredResults();
    const idx = stored.findIndex((r) => r.assessmentId === assessmentId);
    if (idx >= 0) {
      stored[idx] = result;
    } else {
      stored.push(result);
    }
    writeStoredResults(stored);
    return result;
  } catch {
    return getAssuranceResult(assessmentId);
  }
}

export function getAssuranceResults(): AssuranceResult[] {
  return readStoredResults();
}

export function getAssuranceResult(
  assessmentId: string,
): AssuranceResult | undefined {
  return getAssuranceResults().find((result) => result.assessmentId === assessmentId);
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
