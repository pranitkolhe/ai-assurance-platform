import flaggedImages from "../data/flagged-images.json";

import type { FlaggedImage } from "../models/flaggedImage.model";

const images = flaggedImages as FlaggedImage[];

export function getFlaggedImages(): FlaggedImage[] {
  return images;
}

export function getFlaggedImageById(id: string): FlaggedImage | undefined {
  return images.find((image) => image.id === id);
}

export function getFlaggedImagesByAssessment(
  assessmentId: string,
): FlaggedImage[] {
  return images.filter((image) => image.assessmentId === assessmentId);
}
