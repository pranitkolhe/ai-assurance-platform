import type { Asset } from "../models/asset.model";
import type { Reference } from "../models/reference.model";

export interface ReferenceSuggestion {
  reference: Reference;
  score: number;
  reasons: string[];
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function suggestReferences(
  asset: Asset,
  references: Reference[],
  assessmentTask?: string,
): ReferenceSuggestion[] {
  return references
    .filter(
      (reference) =>
        reference.type === asset.type && reference.status === "active",
    )
    .map((reference) => {
      let score = 0;

      const reasons: string[] = [];

      const taskMatches =
        normalize(reference.task) === normalize(assessmentTask);

      const formatMatches =
        normalize(reference.format) === normalize(asset.format);

      if (taskMatches) {
        score += 60;

        reasons.push("Matching assurance task");
      }

      if (formatMatches) {
        score += 30;

        reasons.push("Matching asset format");
      }

      if (asset.type === "dataset") {
        score += 10;

        reasons.push("Distribution profile available");
      }

      if (asset.type === "model") {
        score += 10;

        reasons.push("Behavioral comparison available");
      }

      if (asset.type === "inference") {
        score += 10;

        reasons.push("Provenance comparison available");
      }

      return {
        reference,
        score: Math.min(score, 100),
        reasons,
      };
    })
    .filter((item) => item.score >= 60)
    .sort((a, b) => b.score - a.score);
}
