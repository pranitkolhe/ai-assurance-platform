import {
  getAssessmentById,
  getAssessments,
  getAssetsForAssessment,
  useLiveAssessments,
  useLiveAssets,
} from "../services/assessmentService";
import type { AssetType } from "../models/asset.model";

export function loadAssessments() {
  return getAssessments();
}

export { useLiveAssessments, useLiveAssets };

/**
 * Assessments that actually contain an asset of the given type.
 *
 * This is the fix for "I can see all assets everywhere": domain
 * pages must not list an assessment just because it exists. A
 * model-integrity page shows only assessments with a model asset,
 * a data-integrity page only those with a dataset asset, and so
 * on. Assessments in draft are also excluded: they have not been
 * submitted for investigation yet.
 */
export function loadAssessmentsWithAssetType(type: AssetType) {
  return getAssessments().filter((assessment) => {
    if (assessment.status === "draft") return false;
    return getAssetsForAssessment(assessment.id).some(
      (asset) => asset.type === type,
    );
  });
}

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
