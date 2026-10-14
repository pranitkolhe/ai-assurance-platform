import { apiRequest } from "../api/client";
import type { Reference, ReferenceType } from "../models/reference.model";

const REFS_KEY = "assure_references";

function readStoredReferences(): Reference[] {
  const stored = localStorage.getItem(REFS_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as Reference[]) : [];
  } catch {
    return [];
  }
}

function writeStoredReferences(refs: Reference[]): void {
  localStorage.setItem(REFS_KEY, JSON.stringify(refs));
}

export async function syncReferencesFromApi(): Promise<Reference[]> {
  try {
    const liveRefs = await apiRequest<Reference[]>("/references");
    writeStoredReferences(liveRefs);
    return liveRefs;
  } catch {
    return readStoredReferences();
  }
}

// Auto-sync references in background on load
if (typeof window !== "undefined") {
  syncReferencesFromApi().catch(() => {});
}

export function getReferences(): Reference[] {
  return readStoredReferences();
}

export function getReferenceById(id: string): Reference | undefined {
  return getReferences().find((reference) => reference.id === id);
}

export function getReferencesByType(type: ReferenceType): Reference[] {
  return getReferences().filter(
    (reference) => reference.type === type && reference.status === "active",
  );
}

export function getReferencesByTask(
  type: ReferenceType,
  task: string,
): Reference[] {
  return getReferencesByType(type).filter(
    (reference) => reference.task.toLowerCase() === task.toLowerCase(),
  );
}
