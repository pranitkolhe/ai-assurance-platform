import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import type { Assessment } from "../models/assessment.model";
import type { Asset } from "../models/asset.model";
import type { ProcessingState } from "../models/processing.model";

const ASSESSMENTS_KEY = "assure_assessments";
const ASSETS_KEY = "assure_assets";
export const DATA_UPDATED_EVENT = "assure_data_updated";

export function notifyDataUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT));
    window.dispatchEvent(new CustomEvent("assurance:assessment-updated"));
  }
}


export function normalizeAssessment(raw: any): Assessment {
  const proc = raw.processing || (raw.processing_status ? {
    status: raw.processing_status,
    progress: Number(raw.processing_progress ?? 0),
    currentStep: raw.processing_current_step || "Processing",
    startedAt: raw.processing_started_at,
    completedAt: raw.processing_completed_at,
  } : undefined);

  return {
    id: String(raw.id || ""),
    name: String(raw.name || "Untitled Assessment"),
    contributorId: String(raw.contributorId || raw.contributor_id || ""),
    contributorName: String(raw.contributorName || raw.contributor_name || "Contributor"),
    useCase: String(raw.useCase || raw.use_case || "Computer Vision Assurance"),
    task: String(raw.task || "Object Detection"),
    status: (raw.status || "submitted") as Assessment["status"],
    overallRisk: (raw.overallRisk || raw.overall_risk || "low") as Assessment["overallRisk"],
    confidence: Number(raw.confidence ?? 0),
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    processing: proc ? {
      status: proc.status || "submitted",
      progress: Number(proc.progress ?? 0),
      currentStep: String(proc.currentStep || proc.current_step || "Pending analysis"),
      startedAt: proc.startedAt || proc.started_at,
      completedAt: proc.completedAt || proc.completed_at,
    } : {
      status: "queued",
      progress: 0,
      currentStep: "Pending analysis",
    },
  };
}

export function normalizeAsset(raw: any): Asset {
  return {
    id: String(raw.id || ""),
    assessmentId: String(raw.assessmentId || raw.assessment_id || ""),
    type: (raw.type || "dataset").toLowerCase() as Asset["type"],
    name: String(raw.name || "unnamed_asset"),
    format: String(raw.format || "COCO"),
    size: String(raw.size || "0 MB"),
    sha256: String(raw.sha256 || ""),
    status: (raw.status || "submitted") as Asset["status"],
    uploadedAt: String(raw.uploadedAt || raw.uploaded_at || new Date().toISOString()),
  };
}

function readStoredAssessments(): Assessment[] {
  const stored = localStorage.getItem(ASSESSMENTS_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeAssessment);
  } catch {
    return [];
  }
}

function readStoredAssets(): Asset[] {
  const stored = localStorage.getItem(ASSETS_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeAsset);
  } catch {
    return [];
  }
}

function writeAssessments(records: Assessment[]): void {
  localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(records));
  notifyDataUpdated();
}

function writeAssets(records: Asset[]): void {
  localStorage.setItem(ASSETS_KEY, JSON.stringify(records));
  notifyDataUpdated();
}

/**
 * Fetch live assessments from the PostgreSQL database and update cache.
 */
export async function syncAssessmentsFromApi(): Promise<Assessment[]> {
  try {
    const backendAssessments = await apiRequest<any[]>("/assessments");
    const normalized = backendAssessments.map(normalizeAssessment);
    writeAssessments(normalized);
    return normalized;
  } catch {
    return readStoredAssessments();
  }
}

/**
 * Fetch live assets from the PostgreSQL database and update cache.
 */
export async function syncAssetsFromApi(): Promise<Asset[]> {
  try {
    const backendAssets = await apiRequest<any[]>("/assets");
    const normalized = backendAssets.map(normalizeAsset);
    writeAssets(normalized);
    return normalized;
  } catch {
    return readStoredAssets();
  }
}

// Auto-sync in background on module load
if (typeof window !== "undefined") {
  syncAssessmentsFromApi().catch(() => {});
  syncAssetsFromApi().catch(() => {});
}

export function getDemoAssessments(): Assessment[] {
  return getAssessments();
}

export function getAssessments(): Assessment[] {
  return readStoredAssessments();
}

export function getAssessmentById(assessmentId: string): Assessment | undefined {
  return getAssessments().find((assessment) => assessment.id === assessmentId);
}

export function getAllAssets(): Asset[] {
  return readStoredAssets();
}

export function getAssetsForAssessment(assessmentId: string): Asset[] {
  return getAllAssets().filter((asset) => asset.assessmentId === assessmentId);
}

function getNextId(prefix: string, existingIds: string[]): string {
  const highest = existingIds.reduce((max, id) => {
    const match = id.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(3, "0")}`;
}

export async function createAssessment(
  input: Omit<
    Assessment,
    "id" | "status" | "overallRisk" | "confidence" | "createdAt" | "processing"
  >,
): Promise<Assessment> {
  let createdAssessment: Assessment | null = null;

  try {
    const res = await apiRequest<any>("/assessments", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        contributor_id: input.contributorId,
        contributorId: input.contributorId,
        use_case: input.useCase,
        useCase: input.useCase,
        task: input.task,
      }),
    });
    createdAssessment = normalizeAssessment(res);
  } catch {
    // If backend offline, generate fallback ID
    const existing = getAssessments();
    createdAssessment = {
      ...input,
      id: getNextId("ASM", existing.map((item) => item.id)),
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
  }

  const stored = readStoredAssessments();
  const existingIdx = stored.findIndex((a) => a.id === createdAssessment!.id);
  if (existingIdx >= 0) {
    stored[existingIdx] = createdAssessment!;
  } else {
    stored.unshift(createdAssessment!);
  }
  writeAssessments(stored);
  return createdAssessment!;
}

export async function uploadAssetFile(
  file: File,
  assessmentId: string,
  assetType: string,
  assetFormat: string,
): Promise<Asset> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("assessment_id", assessmentId);
  formData.append("asset_type", assetType);
  formData.append("asset_format", assetFormat);

  let uploaded: Asset;
  try {
    const res = await apiRequest<any>("/assets/upload", {
      method: "POST",
      body: formData,
    });
    uploaded = normalizeAsset(res);
  } catch {
    // Fallback if offline
    const prefix = assetType === "dataset" ? "DATA" : assetType === "model" ? "MODEL" : "INF";
    uploaded = {
      id: getNextId(prefix, getAllAssets().map((a) => a.id)),
      assessmentId,
      type: assetType as any,
      name: file.name,
      format: assetFormat,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      sha256: "calculating...",
      status: "submitted",
      uploadedAt: new Date().toISOString(),
    };
  }

  const stored = readStoredAssets();
  stored.unshift(uploaded);
  writeAssets(stored);
  return uploaded;
}

export function registerAsset(
  assessmentId: string,
  asset: Omit<Asset, "id" | "assessmentId" | "uploadedAt">,
): Asset {
  const existing = getAllAssets();
  const prefix =
    asset.type === "dataset" ? "DATA" : asset.type === "model" ? "MODEL" : "INF";

  const registered: Asset = {
    ...asset,
    id: getNextId(prefix, existing.map((item) => item.id)),
    assessmentId,
    uploadedAt: new Date().toISOString(),
  };

  const stored = readStoredAssets();
  stored.unshift(registered);
  writeAssets(stored);
  return registered;
}

export function updateAssessmentProcessing(
  assessmentId: string,
  processing: ProcessingState,
): Assessment | undefined {
  const records = readStoredAssessments();
  const index = records.findIndex((assessment) => assessment.id === assessmentId);
  if (index === -1) return undefined;

  records[index] = {
    ...records[index],
    processing,
  };
  writeAssessments(records);
  return records[index];
}

/**
 * React hook to subscribe to live assessments with background sync and reactive updates.
 */
export function useLiveAssessments(): Assessment[] {
  const [assessments, setAssessments] = useState<Assessment[]>(() => getAssessments());

  useEffect(() => {
    // Sync immediately from backend
    syncAssessmentsFromApi().then((fresh) => {
      if (fresh) setAssessments(fresh);
    });

    const handler = () => {
      setAssessments(getAssessments());
    };

    window.addEventListener(DATA_UPDATED_EVENT, handler);
    return () => {
      window.removeEventListener(DATA_UPDATED_EVENT, handler);
    };
  }, []);

  return assessments;
}

/**
 * React hook to subscribe to live assets with background sync and reactive updates.
 */
export function useLiveAssets(): Asset[] {
  const [assets, setAssets] = useState<Asset[]>(() => getAllAssets());

  useEffect(() => {
    // Sync immediately from backend
    syncAssetsFromApi().then((fresh) => {
      if (fresh) setAssets(fresh);
    });

    const handler = () => {
      setAssets(getAllAssets());
    };

    window.addEventListener(DATA_UPDATED_EVENT, handler);
    return () => {
      window.removeEventListener(DATA_UPDATED_EVENT, handler);
    };
  }, []);

  return assets;
}
