import references from "../data/references.json";

import type { Reference, ReferenceType } from "../models/reference.model";

const referenceRecords = references as unknown as Reference[];

export function getReferences(): Reference[] {
  return referenceRecords;
}

export function getReferenceById(id: string): Reference | undefined {
  return referenceRecords.find((reference) => reference.id === id);
}

export function getReferencesByType(type: ReferenceType): Reference[] {
  return referenceRecords.filter(
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
