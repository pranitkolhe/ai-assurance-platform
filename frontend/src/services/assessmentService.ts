import assessments from "../data/assessments.json";
import assets from "../data/assets.json";

import type { Assessment } from "../models/assessment.model";
import type { Asset } from "../models/asset.model";
import type { ProcessingState } from "../models/processing.model";

const ASSESSMENTS_KEY = "assure_assessments";
const ASSETS_KEY = "assure_assets";

function readStoredAssessments(): Assessment[] {
  const stored = localStorage.getItem(ASSESSMENTS_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as Assessment[]) : [];
  } catch {
    return [];
  }
}

function readStoredAssets(): Asset[] {
  const stored = localStorage.getItem(ASSETS_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as Asset[]) : [];
  } catch {
    return [];
  }
}

function writeAssessments(records: Assessment[]): void {
  localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(records));
}

function writeAssets(records: Asset[]): void {
  localStorage.setItem(ASSETS_KEY, JSON.stringify(records));
}

function normalizeProcessingState(assessment: Assessment): ProcessingState {
  const existing = assessment.processing;

  if (existing) {
    return existing;
  }

  if (assessment.status === "completed") {
    return {
      status: "completed",
      progress: 100,
      currentStep: "Analysis results available",
    };
  }

  return {
    status: "queued",
    progress: 0,
    currentStep: "Waiting for analyst to start analysis",
  };
}

function normalizeDemoAssessments(): Assessment[] {
  const demo = assessments as unknown as Assessment[];

  return demo.map((assessment) => ({
    ...assessment,
    processing: normalizeProcessingState(assessment),
  }));
}

export function getDemoAssessments(): Assessment[] {
  return normalizeDemoAssessments();
}

export function getAssessments(): Assessment[] {
  const demo = normalizeDemoAssessments();
  const stored = readStoredAssessments();

  const unique = new Map<string, Assessment>();

  [...demo, ...stored].forEach((assessment) => {
    unique.set(assessment.id, {
      ...assessment,
      processing: normalizeProcessingState(assessment),
    });
  });

  return Array.from(unique.values());
}

export function getAssessmentById(
  assessmentId: string,
): Assessment | undefined {
  return getAssessments().find((assessment) => assessment.id === assessmentId);
}

export function getAllAssets(): Asset[] {
  const demo = assets as unknown as Asset[];
  const stored = readStoredAssets();

  const unique = new Map<string, Asset>();

  [...demo, ...stored].forEach((asset) => {
    unique.set(asset.id, asset);
  });

  return Array.from(unique.values());
}

export function getAssetsForAssessment(assessmentId: string): Asset[] {
  return getAllAssets().filter((asset) => asset.assessmentId === assessmentId);
}

function getNextId(prefix: string, existingIds: string[]): string {
  const highest = existingIds.reduce((max, id) => {
    const match = id.match(new RegExp(`^${prefix}-(\\d+)$`));

    if (!match) {
      return max;
    }

    return Math.max(max, Number(match[1]));
  }, 0);

  return `${prefix}-${String(highest + 1).padStart(3, "0")}`;
}

export function createAssessment(
  input: Omit<
    Assessment,
    "id" | "status" | "overallRisk" | "confidence" | "createdAt" | "processing"
  >,
): Assessment {
  const existing = getAssessments();

  const assessment: Assessment = {
    ...input,
    id: getNextId(
      "ASM",
      existing.map((item) => item.id),
    ),
    status: "registered",
    overallRisk: "medium",
    confidence: 0,
    createdAt: new Date().toISOString(),
    processing: {
      status: "queued",
      progress: 0,
      currentStep: "Waiting for analyst to start analysis",
    },
  };

  const stored = readStoredAssessments();

  stored.push(assessment);

  writeAssessments(stored);

  return assessment;
}

export function registerAsset(
  assessmentId: string,
  asset: Omit<Asset, "id" | "assessmentId" | "uploadedAt">,
): Asset {
  const existing = getAllAssets();

  const prefix =
    asset.type === "dataset"
      ? "DATA"
      : asset.type === "model"
        ? "MODEL"
        : "INF";

  const registered: Asset = {
    ...asset,
    id: getNextId(
      prefix,
      existing.map((item) => item.id),
    ),
    assessmentId,
    uploadedAt: new Date().toISOString(),
  };

  const stored = readStoredAssets();

  stored.push(registered);

  writeAssets(stored);

  return registered;
}

export function updateAssessmentProcessing(
  assessmentId: string,
  processing: ProcessingState,
): Assessment | undefined {
  const records = readStoredAssessments();

  const index = records.findIndex(
    (assessment) => assessment.id === assessmentId,
  );

  if (index === -1) {
    return undefined;
  }

  records[index] = {
    ...records[index],
    processing,
  };

  writeAssessments(records);

  return records[index];
}
