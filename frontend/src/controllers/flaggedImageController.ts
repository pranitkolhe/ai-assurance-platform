import {
  getFlaggedImageById,
  getFlaggedImages,
  getFlaggedImagesByAssessment,
} from "../services/flaggedImageService";

export function loadFlaggedImages() {
  return getFlaggedImages();
}

export function loadFlaggedImage(id: string) {
  return getFlaggedImageById(id);
}

export function loadFlaggedImagesForAssessment(assessmentId: string) {
  return getFlaggedImagesByAssessment(assessmentId);
}
