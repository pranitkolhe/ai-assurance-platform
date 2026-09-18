import type { Asset } from "../models/asset.model";

import { getReferencesByType } from "../services/referenceService";

import { suggestReferences } from "../services/referenceSuggestionService";

export function loadReferenceSuggestions(
  asset: Asset,
  assessmentTask?: string,
) {
  const references = getReferencesByType(asset.type);

  return suggestReferences(asset, references, assessmentTask);
}
