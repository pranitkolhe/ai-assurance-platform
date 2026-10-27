/**
 * Engine-service client: the frontend's single route to the
 * standalone analysis services, via the backend.
 *
 * The frontend NEVER talks to a service directly (ports 8101-8105
 * are backend-only). It calls the backend's unified engine routes,
 * which forward to the service and return its full result unchanged.
 *
 * No localStorage fallback, no fake data: if the backend returns
 * 503 (service unavailable / not yet implemented), that error is
 * thrown to the caller, which must display "service unavailable"
 * instead of inventing a pass. See services/CONTRACT.md.
 */

import { apiRequest } from "../api/client";

export type EngineDomain =
  | "data_integrity"
  | "model_integrity"
  | "backdoor_assessment"
  | "inference_provenance"
  | "distribution_shift";

export type EngineStatusValue = "pass" | "review" | "quarantine" | "unavailable";

export interface EngineFinding {
  id: string;
  title: string;
  severity: string;
  reason: string;
  evidence: Record<string, unknown>;
  affected_assets: string[];
}

export interface EngineResult {
  domain: string;
  status: EngineStatusValue;
  score: number;
  confidence: number;
  findings: EngineFinding[];
  limitations: string[];
  unsupported?: string[];
  [key: string]: unknown;
}

export interface EngineServiceStatus {
  service: string;
  domain: string;
  port: number;
  url: string;
  status: string;
  version?: string | null;
  detail?: string | null;
}

export interface EngineAnalyzePayload {
  path?: string;
  dataset_path?: string;
  model_path?: string;
  asset_path?: string;
  clean_dataset_path?: string;
  manifest?: Record<string, unknown>;
  format?: string;
  reference?: Record<string, unknown>;
  access_level?: string;
}

/** Health of all five services, from GET /engines/status. */
export async function fetchEngineStatus(): Promise<EngineServiceStatus[]> {
  return apiRequest<EngineServiceStatus[]>("/engines/status");
}

/** Run one domain's service through the backend. Throws on 503. */
export async function analyzeEngine(
  domain: EngineDomain,
  payload: EngineAnalyzePayload,
): Promise<EngineResult> {
  return apiRequest<EngineResult>(`/engines/${domain}/analyze`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Asset-specific convenience wrappers (same backend, same rules). */
export interface DatasetIntegrityLegacy {
  asset_id: string;
  format: string;
  valid: boolean;
  total_images: number;
  total_annotations: number;
  duplicate_count: number;
  corrupt_samples_count: number;
  warnings: string[];
  score?: number;
  confidence?: number;
  engine_status?: string;
}

export async function fetchDatasetIntegrity(assetId: string): Promise<DatasetIntegrityLegacy> {
  // NOTE: this legacy endpoint returns a reduced shape (totals and
  // finding titles only). For the full engine result -- score,
  // findings, limitations -- use analyzeEngine("data_integrity",
  // { path }) instead. Expanding the legacy schema is Phase 5 work.
  return apiRequest<DatasetIntegrityLegacy>(`/datasets/${assetId}/integrity`);
}

export async function fetchModelIntegrity(assetId: string): Promise<EngineResult> {
  return apiRequest<EngineResult>(`/models/${assetId}/integrity`);
}

export async function fetchBackdoorAssessment(assetId: string): Promise<EngineResult> {
  return apiRequest<EngineResult>(`/backdoor/${assetId}/assessment`);
}

export async function fetchDistributionShift(assessmentId: string): Promise<EngineResult> {
  return apiRequest<EngineResult>(`/distribution-shift/${assessmentId}/summary`);
}

export async function verifyProvenance(
  manifest: Record<string, unknown>,
  assetPath?: string,
): Promise<EngineResult> {
  return apiRequest<EngineResult>("/provenance/verify", {
    method: "POST",
    body: JSON.stringify({ manifest, asset_path: assetPath }),
  });
}
