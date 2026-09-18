import { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Database,
  FileCheck2,
  FileText,
  Play,
  ShieldAlert,
  X,
} from "lucide-react";

import { loadAssessmentDetails } from "../../../controllers/assessmentController";

import { loadAssuranceResult } from "../../../controllers/assuranceController";

import { loadReferenceSuggestions } from "../../../controllers/referenceSuggestionController";

import { recordReferenceAssignment } from "../../../controllers/referenceAssignmentController";

import { loadReferences } from "../../../controllers/referenceController";

import {
  advanceProcessing,
  getProcessingState,
  startProcessing,
} from "../../../services/processingService";

import type { Asset } from "../../../models/asset.model";

import type { Assessment } from "../../../models/assessment.model";

import type { AssuranceResult } from "../../../models/assurance.model";

import { useAuth } from "../../../context/AuthContext";

interface SelectedReferences {
  [assetId: string]: string | null;
}

export default function AssessmentDetailsPage() {
  const { id } = useParams<{
    id: string;
  }>();

  const { user } = useAuth();

  const [details, setDetails] =
    useState<ReturnType<typeof loadAssessmentDetails>>(undefined);

  const [assurance, setAssurance] = useState<AssuranceResult | undefined>(
    undefined,
  );

  const [processing, setProcessing] = useState(
    id ? getProcessingState(id) : undefined,
  );

  const [showReferenceModal, setShowReferenceModal] = useState(false);

  const [selectedReferences, setSelectedReferences] =
    useState<SelectedReferences>({});

  const [startingAnalysis, setStartingAnalysis] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loaded = loadAssessmentDetails(id);

    setDetails(loaded);

    setProcessing(getProcessingState(id));

    setAssurance(loadAssuranceResult(id));
  }, [id]);

  /*
   * AUTOMATIC PROCESSING
   *
   * No Continue button.
   *
   * Once startProcessing() has been called,
   * this effect automatically advances the
   * assurance pipeline.
   */
  useEffect(() => {
    if (!id || !processing) {
      return;
    }

    const automaticStates = [
      "registering",
      "queued",
      "processing",
      "analysis_complete",
    ];

    if (!automaticStates.includes(processing.status)) {
      return;
    }

    const timer = window.setTimeout(() => {
      const next = advanceProcessing(id);

      if (!next) {
        return;
      }

      setProcessing(next);

      if (next.status === "analysis_complete" || next.status === "completed") {
        setAssurance(loadAssuranceResult(id));
      }
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [id, processing]);

  if (!id) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <p className="text-sm text-slate-600">Assessment ID is missing.</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <p className="text-sm text-slate-600">Assessment not found.</p>
      </div>
    );
  }

  const { assessment, assets } = details;

  const analysisStarted =
    processing?.status === "registering" ||
    processing?.status === "queued" ||
    processing?.status === "processing" ||
    processing?.status === "analysis_complete" ||
    processing?.status === "completed";

  const analysisComplete =
    processing?.status === "analysis_complete" ||
    processing?.status === "completed";

  function openStartModal() {
    if (analysisStarted || startingAnalysis) {
      return;
    }

    const initial: SelectedReferences = {};

    assets.forEach((asset) => {
      initial[asset.id] = null;
    });

    setSelectedReferences(initial);

    setShowReferenceModal(true);
  }

  function changeReference(assetId: string, referenceId: string | null) {
    setSelectedReferences((previous) => ({
      ...previous,
      [assetId]: referenceId,
    }));
  }

  function confirmStartAnalysis() {
    if (!user) {
      return;
    }

    if (analysisStarted) {
      return;
    }

    setStartingAnalysis(true);

    /*
     * Persist the analyst's explicit choice
     * for EVERY submitted asset.
     */
    assets.forEach((asset) => {
      const referenceId = selectedReferences[asset.id];

      recordReferenceAssignment({
        assessmentId: assessment.id,

        assetId: asset.id,

        referenceId: referenceId ?? undefined,

        status: referenceId ? "assigned" : "without_reference",

        assignedBy: user.name,

        assignedAt: new Date().toISOString(),

        note: referenceId
          ? "Reference explicitly selected by analyst."
          : "Analyst explicitly chose to continue without a reference.",
      });
    });

    /*
     * THIS IS THE ONLY START ACTION.
     *
     * From here, the pipeline is automatic.
     */
    const initial = startProcessing(assessment.id);

    setProcessing(initial);

    setShowReferenceModal(false);

    setStartingAnalysis(false);
  }

  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              to="/analyst/assessments"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to Assessments
            </Link>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                <ShieldAlert size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {assessment.name}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {assessment.id} · {assessment.contributorName}
                </p>
              </div>
            </div>
          </div>

          {!analysisStarted && (
            <button
              type="button"
              onClick={openStartModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Play size={17} />
              START ANALYSIS
            </button>
          )}

          {analysisStarted && !analysisComplete && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              <Activity size={17} className="animate-pulse" />
              ANALYSIS IN PROGRESS
            </div>
          )}

          {analysisComplete && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={17} />
              ANALYSIS COMPLETE
            </div>
          )}
        </div>

        {/* SUMMARY */}

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Task" value={assessment.task} />

          <SummaryCard label="Use Case" value={assessment.useCase} />

          <SummaryCard label="Assets" value={`${assets.length} submitted`} />
        </div>

        {/* AUTOMATIC PROCESSING */}

        {analysisStarted && <ProcessingPanel processing={processing} />}

        {/* NOT STARTED */}

        {!analysisStarted && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <ShieldAlert size={20} className="mt-0.5 text-amber-600" />

              <div>
                <h2 className="font-semibold text-amber-900">
                  Analysis has not started
                </h2>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Opening this assessment or selecting an asset does not execute
                  any assurance tests. Click START ANALYSIS when you are ready
                  to configure references and begin the automated pipeline.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ASSETS */}

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Submitted Assets
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assets registered for this assessment.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                analysisStarted={analysisStarted}
              />
            ))}
          </div>
        </section>

        {/* RESULTS */}

        {analysisComplete && assurance && (
          <AssuranceResults assurance={assurance} />
        )}
      </div>

      {/* REFERENCE MODAL */}

      {showReferenceModal && (
        <ReferenceConfigurationModal
          assessment={assessment}
          assets={assets}
          selectedReferences={selectedReferences}
          onReferenceChange={changeReference}
          onCancel={() => setShowReferenceModal(false)}
          onStart={confirmStartAnalysis}
          starting={startingAnalysis}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* SUMMARY                                                                    */
/* -------------------------------------------------------------------------- */

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PROCESSING                                                                 */
/* -------------------------------------------------------------------------- */

function ProcessingPanel({
  processing,
}: {
  processing: ReturnType<typeof getProcessingState> | undefined;
}) {
  const progress = processing?.progress ?? 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <Activity
              size={20}
              className={progress < 100 ? "animate-pulse" : ""}
            />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              Automated Assurance Processing
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {processing?.currentStep}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-semibold text-slate-950">{progress}%</p>

          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Automatic processing
          </p>
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-700"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <PipelineStep label="Register" active={progress >= 5} />

        <PipelineStep label="Queue" active={progress >= 15} />

        <PipelineStep label="Assurance Tests" active={progress >= 25} />

        <PipelineStep label="Evidence Correlation" active={progress >= 70} />

        <PipelineStep label="Results" active={progress >= 100} />
      </div>
    </section>
  );
}

function PipelineStep({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* ASSET CARD                                                                 */
/* -------------------------------------------------------------------------- */

function AssetCard({
  asset,
  analysisStarted,
}: {
  asset: Asset;
  analysisStarted: boolean;
}) {
  const Icon =
    asset.type === "dataset"
      ? Database
      : asset.type === "model"
        ? ShieldAlert
        : FileCheck2;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
            <Icon size={19} />
          </div>

          <div>
            <p className="font-semibold text-slate-900">{asset.name}</p>

            <p className="mt-1 text-xs text-slate-500">
              {asset.type.toUpperCase()} · {asset.format}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {asset.status}
        </span>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400">File size</p>

        <p className="mt-1 text-sm font-medium text-slate-700">{asset.size}</p>
      </div>

      {analysisStarted ? (
        <Link
          to={`/analyst/${
            asset.type === "dataset"
              ? "data-integrity"
              : asset.type === "model"
                ? "model-integrity"
                : "inference-verification"
          }?assessmentId=${asset.assessmentId}&assetId=${asset.id}`}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <FileText size={16} />
          Investigate
        </Link>
      ) : (
        <div className="mt-4 flex w-full items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-400">
          Analysis not started
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* REFERENCE MODAL                                                            */
/* -------------------------------------------------------------------------- */

function ReferenceConfigurationModal({
  assessment,
  assets,
  selectedReferences,
  onReferenceChange,
  onCancel,
  onStart,
  starting,
}: {
  assessment: Assessment;
  assets: Asset[];
  selectedReferences: {
    [assetId: string]: string | null;
  };
  onReferenceChange: (assetId: string, referenceId: string | null) => void;
  onCancel: () => void;
  onStart: () => void;
  starting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Configure Analysis References
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Choose a suitable reference for each submitted asset. References
              are optional. If no reference is selected, the assurance engine
              continues with the available standalone checks.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={starting}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {assets.map((asset) => (
              <ReferenceConfigurationRow
                key={asset.id}
                assessment={assessment}
                asset={asset}
                selectedReferenceId={selectedReferences[asset.id] ?? null}
                onChange={(referenceId) =>
                  onReferenceChange(asset.id, referenceId)
                }
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Reference choices are recorded with the assessment before processing
            begins.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={starting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onStart}
              disabled={starting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play size={16} />

              {starting ? "STARTING..." : "START ANALYSIS"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* REFERENCE ROW                                                              */
/* -------------------------------------------------------------------------- */

function ReferenceConfigurationRow({
  assessment,
  asset,
  selectedReferenceId,
  onChange,
}: {
  assessment: Assessment;
  asset: Asset;
  selectedReferenceId: string | null;
  onChange: (referenceId: string | null) => void;
}) {
  const references = loadReferences();

  const suggestions = loadReferenceSuggestions(asset, assessment.task);

  const selectedReference = references.find(
    (reference) => reference.id === selectedReferenceId,
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
              {asset.type === "dataset" ? (
                <Database size={18} />
              ) : asset.type === "model" ? (
                <ShieldAlert size={18} />
              ) : (
                <FileCheck2 size={18} />
              )}
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">{asset.name}</h3>

              <p className="mt-1 text-xs text-slate-500">
                {asset.type} · {asset.format}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full lg:max-w-md">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reference
          </label>

          <select
            value={selectedReferenceId ?? ""}
            onChange={(event) => onChange(event.target.value || null)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Continue without reference</option>

            {suggestions.map(({ reference, score }) => (
              <option key={reference.id} value={reference.id}>
                {reference.name} · {score}% compatibility
              </option>
            ))}
          </select>

          {selectedReference ? (
            <div className="mt-3 rounded-xl bg-blue-50 p-3">
              <p className="text-xs font-semibold text-blue-900">
                Selected reference
              </p>

              <p className="mt-1 text-sm font-medium text-blue-800">
                {selectedReference.name}
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                {selectedReference.description}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-slate-400">
              No reference will be used for this asset. Standalone assurance
              checks will still run.
            </p>
          )}

          {suggestions.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              No suitable registered reference was found for this asset and
              task.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* RESULTS                                                                    */
/* -------------------------------------------------------------------------- */

function AssuranceResults({ assurance }: { assurance: AssuranceResult }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Assurance Analysis
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Results generated by the completed assurance pipeline.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ResultCard
          label="Overall Risk"
          value={assurance.overallRisk.toUpperCase()}
        />

        <ResultCard
          label="Confidence"
          value={`${assurance.overallConfidence}%`}
        />

        <ResultCard
          label="Recommendation"
          value={assurance.recommendation.toUpperCase()}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {assurance.domains.map((domain) => (
          <div
            key={domain.domain}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Assurance Domain
                </p>

                <h3 className="mt-1 font-semibold text-slate-900">
                  {formatDomain(domain.domain)}
                </h3>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  domain.status === "pass"
                    ? "bg-emerald-50 text-emerald-700"
                    : domain.status === "warning"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700"
                }`}
              >
                {domain.status}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {domain.summary}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Score</p>

                <p className="mt-1 font-semibold text-slate-900">
                  {domain.score}%
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Confidence</p>

                <p className="mt-1 font-semibold text-slate-900">
                  {domain.confidence}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function formatDomain(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
