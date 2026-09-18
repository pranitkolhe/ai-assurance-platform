import type { ReferenceAssignment } from "../models/referenceAssignment.model";

const STORAGE_KEY = "assure_reference_assignments";

function readAssignments(): ReferenceAssignment[] {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as ReferenceAssignment[]) : [];
  } catch {
    return [];
  }
}

function writeAssignments(assignments: ReferenceAssignment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));

  window.dispatchEvent(new CustomEvent("assurance:assessment-updated"));
}

export function getReferenceAssignments(): ReferenceAssignment[] {
  return readAssignments();
}

export function getReferenceAssignment(
  assessmentId: string,
  assetId: string,
): ReferenceAssignment | undefined {
  return readAssignments().find(
    (item) => item.assessmentId === assessmentId && item.assetId === assetId,
  );
}

export function saveReferenceAssignment(
  assignment: ReferenceAssignment,
): ReferenceAssignment {
  const assignments = readAssignments();

  const index = assignments.findIndex(
    (item) =>
      item.assessmentId === assignment.assessmentId &&
      item.assetId === assignment.assetId,
  );

  if (index >= 0) {
    assignments[index] = assignment;
  } else {
    assignments.push(assignment);
  }

  writeAssignments(assignments);

  return assignment;
}
