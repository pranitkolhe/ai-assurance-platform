import type { FlaggedImage } from "../models/flaggedImage.model";

const FLAGGED_KEY = "assure_flagged_images";

function readStoredFlaggedImages(): FlaggedImage[] {
  const stored = localStorage.getItem(FLAGGED_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as FlaggedImage[]) : [];
  } catch {
    return [];
  }
}

export function getFlaggedImages(): FlaggedImage[] {
  return readStoredFlaggedImages();
}

export function getFlaggedImageById(id: string): FlaggedImage | undefined {
  return getFlaggedImages().find((image) => image.id === id);
}

export function getFlaggedImagesByAssessment(
  assessmentId: string,
): FlaggedImage[] {
  return getFlaggedImages().filter((image) => image.assessmentId === assessmentId);
}
