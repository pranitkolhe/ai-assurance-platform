import {
  getReferenceAssignment,
  getReferenceAssignments,
  saveReferenceAssignment,
} from "../services/referenceAssignmentService";

import type { ReferenceAssignment } from "../models/referenceAssignment.model";

export function loadReferenceAssignments(): ReferenceAssignment[] {
  return getReferenceAssignments();
}

export function loadReferenceAssignment(
  assessmentId: string,
  assetId: string,
): ReferenceAssignment | undefined {
  return getReferenceAssignment(assessmentId, assetId);
}

export function recordReferenceAssignment(
  assignment: ReferenceAssignment,
): ReferenceAssignment {
  return saveReferenceAssignment(assignment);
}
