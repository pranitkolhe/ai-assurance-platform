import {
  getReferenceById,
  getReferences,
  getReferencesByTask,
  getReferencesByType,
} from "../services/referenceService";

import type { ReferenceType } from "../models/reference.model";

export function loadReferences() {
  return getReferences();
}

export function loadReference(id: string) {
  return getReferenceById(id);
}

export function loadReferencesByType(type: ReferenceType) {
  return getReferencesByType(type);
}

export function loadReferencesForTask(type: ReferenceType, task: string) {
  return getReferencesByTask(type, task);
}
