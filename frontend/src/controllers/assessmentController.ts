import {
  getAssessmentById,
  getAssessments,
  getAssetsForAssessment,
  useLiveAssessments,
  useLiveAssets,
} from "../services/assessmentService";

export function loadAssessments() {
  return getAssessments();
}

export { useLiveAssessments, useLiveAssets };


export function loadAssessmentDetails(assessmentId: string) {
  const assessment = getAssessmentById(assessmentId);

  if (!assessment) {
    return undefined;
  }

  const assets = getAssetsForAssessment(assessmentId);

  return {
    assessment,
    assets,
  };
}
