import evidence from "../data/evidence.json";

import type { Evidence } from "../models/evidence.model";

const evidenceRecords = evidence as Evidence[];

export function loadEvidence(): Evidence[] {
  return evidenceRecords;
}

export function loadEvidenceById(id: string): Evidence | undefined {
  return evidenceRecords.find((item) => item.id === id);
}

export function loadEvidenceByFinding(findingId: string): Evidence[] {
  return evidenceRecords.filter((item) => item.findingId === findingId);
}
