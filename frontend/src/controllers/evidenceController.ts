import type { Evidence } from "../models/evidence.model";

const EVIDENCE_KEY = "assure_evidence";

function readStoredEvidence(): Evidence[] {
  const stored = localStorage.getItem(EVIDENCE_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as Evidence[]) : [];
  } catch {
    return [];
  }
}

export function loadEvidence(): Evidence[] {
  return readStoredEvidence();
}

export function loadEvidenceById(id: string): Evidence | undefined {
  return readStoredEvidence().find((item) => item.id === id);
}

export function loadEvidenceByFinding(findingId: string): Evidence[] {
  return readStoredEvidence().filter((item) => item.findingId === findingId);
}
