import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  loadAssessmentDetails,
  loadAssessmentsWithAssetType,
  useLiveAssessments,
  useLiveAssets,
} from "../../../controllers/assessmentController";
import { loadAssuranceResult } from "../../../controllers/assuranceController";

import type { Assessment } from "../../../models/assessment.model";
import type { Asset } from "../../../models/asset.model";
import type {
  AssuranceDomainResult,
  AssuranceResult,
} from "../../../models/assurance.model";

function getStatusClass(status: string) {
  if (status === "pass") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
  }

  if (status === "warning") {
    return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  }

  if (status === "fail") {
    return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200";
}

function getAssetStatusClass(status: string) {
  if (status === "verified") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
  }

  if (status === "flagged") {
    return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
  }

  if (status === "submitted") {
    return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200";
}

function getSeverityClass(severity: string) {
  if (severity === "critical" || severity === "high") {
    return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
  }

  if (severity === "medium") {
    return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200";
}

function VerificationStatusIcon({
  status,
}: {
  status: "pass" | "warning" | "fail";
}) {
  if (status === "pass") {
    return <CheckCircle2 size={18} />;
  }

  if (status === "fail") {
    return <XCircle size={18} />;
  }

  return <ShieldAlert size={18} />;
}

/* -------------------------------------------------------------------------- */
/* Overview                                                                    */
/* -------------------------------------------------------------------------- */

function InferenceVerificationOverview() {
  const liveAssessments = useLiveAssessments();
  useLiveAssets();
  // Only assessments that actually contain an inference asset.
  // Recomputed when the live sync returns, so a newly uploaded
  // inference asset appears without a manual refresh.
  const assessments = useMemo(
    () => loadAssessmentsWithAssetType("inference"),
    [liveAssessments],
  );

  return (
    <div className="space-y-8">
      {/* Page header */}

      <section>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Analyst Assurance
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Inference Verification
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Select an assessment to investigate inference provenance, model
              identity, preprocessing integrity, replay protection, and output
              integrity.
            </p>
          </div>

          <div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:block">
            <p className="text-xs font-medium text-slate-400">Assessments</p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {assessments.length}
            </p>
          </div>
        </div>
      </section>

      {/* Assessment selection */}

      {assessments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <FileCheck2 size={23} />
          </div>

          <h2 className="mt-4 text-sm font-bold text-slate-800">
            No assessments available
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
            There are currently no assessments available for inference
            verification.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {assessments.map((assessment: Assessment) => {
            const details = loadAssessmentDetails(assessment.id);

            const inferenceAsset = details?.assets.find(
              (asset: Asset) => asset.type === "inference",
            );

            const result = loadAssuranceResult(assessment.id);

            const domain = result?.domains.find(
              (item) => item.domain === "inference_verification",
            );

            return (
              <div
                key={assessment.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                {/* Assessment heading */}

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-400">
                      {assessment.id}
                    </p>

                    <h2 className="mt-1 truncate text-base font-bold text-slate-900">
                      {assessment.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {assessment.contributorName}
                    </p>
                  </div>

                  {domain ? (
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Score
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {domain.score}
                      </p>
                    </div>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      Pending
                    </span>
                  )}
                </div>

                {/* Inference asset */}

                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                        <FileCheck2 size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Inference Asset
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                          {inferenceAsset?.name ?? "Not submitted"}
                        </p>
                      </div>
                    </div>

                    {inferenceAsset && (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getAssetStatusClass(
                          inferenceAsset.status,
                        )}`}
                      >
                        {inferenceAsset.status}
                      </span>
                    )}
                  </div>

                  {inferenceAsset && (
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>{inferenceAsset.format}</span>
                      <span>{inferenceAsset.size}</span>
                    </div>
                  )}
                </div>

                {/* Result status */}

                {domain && (
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${getStatusClass(
                        domain.status,
                      )}`}
                    >
                      {domain.status}
                    </span>

                    <span className="text-xs font-semibold text-slate-500">
                      Confidence {domain.confidence}%
                    </span>
                  </div>
                )}

                {/* Investigation action */}

                <Link
                  to={`/analyst/inference-verification?assessment=${assessment.id}`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                  Investigate →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Assessment report                                                           */
/* -------------------------------------------------------------------------- */

function InferenceVerificationReport({
  assessment,
  inferenceAsset,
  domain,
}: {
  assessment: Assessment;
  inferenceAsset: Asset | undefined;
  domain: AssuranceDomainResult | undefined;
}) {
  /* No inference asset */

  if (!inferenceAsset) {
    return (
      <div className="space-y-6">
        <Link
          to="/analyst/inference-verification"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Inference Verification
        </Link>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FileCheck2 size={27} />
          </div>

          <h2 className="mt-5 text-base font-bold text-slate-800">
            Inference Asset Unavailable
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            No inference asset has been submitted for {assessment.id}.
            Verification cannot be performed without an inference record.
          </p>
        </div>
      </div>
    );
  }

  /* Asset exists but analysis is not available */

  if (!domain) {
    return (
      <div className="space-y-6">
        <Link
          to="/analyst/inference-verification"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Inference Verification
        </Link>

        <div className="rounded-2xl border border-amber-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Clock3 size={27} />
          </div>

          <h2 className="mt-5 text-base font-bold text-slate-800">
            Verification Result Unavailable
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            The inference asset exists, but no inference verification result has
            been produced for this assessment yet.
          </p>

          <div className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-left text-xs text-amber-700">
            <Activity size={15} className="shrink-0" />

            <span>Automated assurance processing may still be pending.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}

      <section>
        <Link
          to="/analyst/inference-verification"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Inference Verification
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                {assessment.id}
              </span>

              <span className="text-xs text-slate-400">
                Inference Assurance
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {assessment.name}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Inference Verification
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-2 self-start rounded-xl px-3 py-2 text-xs font-bold capitalize lg:self-auto ${getStatusClass(
              domain.status,
            )}`}
          >
            <VerificationStatusIcon status={domain.status} />
            {domain.status}
          </span>
        </div>
      </section>

      {/* Summary */}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Verification Score
            </p>

            <ShieldCheck size={18} className="text-blue-500" />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {domain.score}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Inference integrity assessment
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Confidence
            </p>

            <Activity size={18} className="text-blue-500" />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {domain.confidence}%
          </p>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${Math.min(domain.confidence, 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </p>

            <FileCheck2 size={18} className="text-blue-500" />
          </div>

          <p className="mt-3 text-2xl font-bold capitalize text-slate-900">
            {domain.status}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Current inference verification state
          </p>
        </div>
      </section>

      {/* Asset */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Inference Asset
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Inference record selected for verification.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${getAssetStatusClass(
                inferenceAsset.status,
              )}`}
            >
              {inferenceAsset.status}
            </span>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <FileText size={15} />

              <p className="text-[11px] font-semibold uppercase tracking-wider">
                File
              </p>
            </div>

            <p className="mt-2 truncate text-sm font-semibold text-slate-800">
              {inferenceAsset.name}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <FileCheck2 size={15} />

              <p className="text-[11px] font-semibold uppercase tracking-wider">
                Format
              </p>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-800">
              {inferenceAsset.format}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Activity size={15} />

              <p className="text-[11px] font-semibold uppercase tracking-wider">
                Size
              </p>
            </div>

            <p className="mt-2 text-sm font-semibold text-slate-800">
              {inferenceAsset.size}
            </p>
          </div>
        </div>
      </section>

      {/* Verification summary */}

      <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Verification Summary
            </h2>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              {domain.summary}
            </p>
          </div>
        </div>
      </section>

      {/* Verification checks */}

      <section>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Verification Checks
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Individual checks produced by the inference verification analysis.
          </p>
        </div>

        {domain.metrics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Activity className="mx-auto text-slate-300" size={32} />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No verification checks available
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Verification metrics have not been produced for this assessment.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {domain.metrics.map((metric) => (
              <div
                key={metric.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      metric.status === "pass"
                        ? "bg-emerald-50 text-emerald-600"
                        : metric.status === "fail"
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    <VerificationStatusIcon status={metric.status} />
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${getStatusClass(
                      metric.status,
                    )}`}
                  >
                    {metric.status}
                  </span>
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-900">
                  {metric.name}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {metric.description}
                </p>

                <p className="mt-4 text-xl font-bold text-slate-900">
                  {metric.value}
                  {metric.unit ? ` ${metric.unit}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Findings */}

      <section>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Verification Findings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Findings associated with this inference verification result.
          </p>
        </div>

        {domain.findings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No findings reported
            </p>

            <p className="mt-1 text-sm text-slate-500">
              No inference verification findings are currently associated with
              this assessment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {domain.findings.map((finding) => (
              <article
                key={finding.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="flex min-w-0 gap-4">
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        finding.severity === "critical" ||
                        finding.severity === "high"
                          ? "bg-red-50 text-red-600"
                          : finding.severity === "medium"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <ShieldAlert size={19} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900">
                        {finding.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {finding.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${getSeverityClass(
                      finding.severity,
                    )}`}
                  >
                    {finding.severity}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Confidence
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {finding.confidence}%
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Affected Samples
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {finding.affectedSamples}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Detection Method
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {finding.detectionMethod}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function InferenceVerificationPage() {
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get("assessment");

  const [assessment, setAssessment] = useState<Assessment | undefined>();
  const [inferenceAsset, setInferenceAsset] = useState<Asset | undefined>();
  const [result, setResult] = useState<AssuranceResult | undefined>();

  useEffect(() => {
    if (!assessmentId) {
      setAssessment(undefined);
      setInferenceAsset(undefined);
      setResult(undefined);
      return;
    }

    const details = loadAssessmentDetails(assessmentId);

    if (!details) {
      setAssessment(undefined);
      setInferenceAsset(undefined);
      setResult(undefined);
      return;
    }

    setAssessment(details.assessment);

    setInferenceAsset(
      details.assets.find((asset: Asset) => asset.type === "inference"),
    );

    setResult(loadAssuranceResult(assessmentId));
  }, [assessmentId]);

  /*
   * Same flow as Dataset Integrity and Model Integrity:
   *
   * /analyst/inference-verification
   *        ↓
   * assessment selection
   *
   * /analyst/inference-verification?assessment=ASM-001
   *        ↓
   * assessment-specific investigation
   */

  if (!assessmentId) {
    return <InferenceVerificationOverview />;
  }

  if (!assessment) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <FileCheck2 size={23} />
        </div>

        <h2 className="mt-4 text-base font-bold text-slate-800">
          Assessment Not Found
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          The requested assessment could not be loaded.
        </p>

        <Link
          to="/analyst/inference-verification"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
        >
          Back to Inference Verification
        </Link>
      </div>
    );
  }

  const domain = result?.domains.find(
    (item) => item.domain === "inference_verification",
  );

  return (
    <InferenceVerificationReport
      assessment={assessment}
      inferenceAsset={inferenceAsset}
      domain={domain}
    />
  );
}
