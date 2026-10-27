import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Database,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import {
  loadAssessmentDetails,
  useLiveAssessments,
} from "../../../controllers/assessmentController";
import { useLiveAssuranceResults } from "../../../services/liveAssuranceService";
import {
  recordRiskDecision,
  loadRiskDecision,
} from "../../../controllers/riskDecisionController";

import type {
  AssuranceDomainResult,
  AssuranceResult,
} from "../../../models/assurance.model";
import type { Assessment } from "../../../models/assessment.model";

type RiskLevel = "low" | "medium" | "high";
type Disposition = "accept" | "review" | "quarantine";

interface AssessmentRiskContext {
  assessment: Assessment;
  result?: AssuranceResult;
}

function domainLabel(domain: string): string {
  switch (domain) {
    case "data_integrity":
      return "Data Integrity";
    case "model_integrity":
      return "Model Integrity";
    case "inference_verification":
      return "Inference Verification";
    case "distribution_analysis":
      return "Distribution Analysis";
    default:
      return domain;
  }
}

function domainPath(domain: string): string {
  switch (domain) {
    case "data_integrity":
      return "/analyst/data-integrity";
    case "model_integrity":
      return "/analyst/model-integrity";
    case "inference_verification":
      return "/analyst/inference-verification";
    case "distribution_analysis":
      return "/analyst/distribution-analysis";
    default:
      return "/analyst/assessments";
  }
}

function domainIcon(domain: string) {
  switch (domain) {
    case "data_integrity":
      return Database;
    case "model_integrity":
      return ShieldCheck;
    case "inference_verification":
      return FileCheck2;
    case "distribution_analysis":
      return Activity;
    default:
      return ShieldAlert;
  }
}

function riskClasses(risk: RiskLevel): string {
  switch (risk) {
    case "high":
      return "border-red-200 bg-red-50 text-red-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

function statusClasses(status: AssuranceDomainResult["status"]): string {
  switch (status) {
    case "fail":
      return "border-red-200 bg-red-50 text-red-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "pass":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

function severityClasses(severity: string): string {
  switch (severity) {
    case "critical":
    case "high":
      return "border-red-200 bg-red-50 text-red-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function dispositionLabel(disposition: Disposition): string {
  switch (disposition) {
    case "accept":
      return "Accept";
    case "review":
      return "Review";
    case "quarantine":
      return "Quarantine";
  }
}

function dispositionClasses(disposition: Disposition): string {
  switch (disposition) {
    case "accept":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "review":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "quarantine":
      return "border-red-200 bg-red-50 text-red-700";
  }
}

function RiskOverview({
  assessments,
  onSelect,
}: {
  assessments: AssessmentRiskContext[];
  onSelect: (assessmentId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Risk Assessment
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review assurance risk, confidence, findings, and recommended
          disposition across assessments.
        </p>
      </div>

      <div className="grid gap-4">
        {assessments.map(({ assessment, result }) => {
          const risk: RiskLevel = result?.overallRisk ?? assessment.overallRisk;

          const confidence = result?.overallConfidence ?? assessment.confidence;

          return (
            <button
              key={assessment.id}
              type="button"
              onClick={() => onSelect(assessment.id)}
              className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      {assessment.id}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${riskClasses(
                        risk,
                      )}`}
                    >
                      {risk} risk
                    </span>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize text-slate-500">
                      {assessment.status}
                    </span>
                  </div>

                  <h2 className="mt-2 text-base font-semibold text-slate-900">
                    {assessment.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {assessment.contributorName} · {assessment.task}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Confidence
                    </p>

                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {confidence}%
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {assessments.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 font-semibold text-slate-900">
            No assessments available
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Assessment risk information will appear here when assessments are
            available.
          </p>
        </div>
      )}
    </div>
  );
}

function RiskReport({
  context,
  onBack,
}: {
  context: AssessmentRiskContext;
  onBack: () => void;
}) {
  const { assessment, result } = context;

  const [analystDecision, setAnalystDecision] = useState<Disposition | null>(
    null,
  );
  useEffect(() => {
    const savedDecision = loadRiskDecision(assessment.id);

    if (savedDecision) {
      setAnalystDecision(savedDecision.disposition);
    }
  }, [assessment.id]);
  const details = loadAssessmentDetails(assessment.id);

  if (!result || result.domains.length === 0) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Risk Assessment
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Risk Assessment Unavailable
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            No completed assurance result is currently available for this
            assessment. Risk assessment will become available after assurance
            analysis is complete.
          </p>
        </div>
      </div>
    );
  }

  const highFindings = result.domains.reduce(
    (total, domain) =>
      total +
      domain.findings.filter(
        (finding) =>
          finding.severity === "high" || finding.severity === "critical",
      ).length,
    0,
  );

  const mediumFindings = result.domains.reduce(
    (total, domain) =>
      total +
      domain.findings.filter((finding) => finding.severity === "medium").length,
    0,
  );

  const failedDomains = result.domains.filter(
    (domain) => domain.status === "fail",
  ).length;

  const warningDomains = result.domains.filter(
    (domain) => domain.status === "warning",
  ).length;

  const assetCount = details?.assets.length ?? 0;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Risk Assessment
      </button>

      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-400">
                {assessment.id}
              </span>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${riskClasses(
                  result.overallRisk,
                )}`}
              >
                {result.overallRisk} risk
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize text-slate-500">
                {assessment.status}
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {assessment.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {assessment.contributorName} · {assessment.task}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-400">Overall Risk</p>

              <p className="mt-1 text-lg font-semibold capitalize text-slate-900">
                {result.overallRisk}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-400">Confidence</p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {result.overallConfidence}%
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-400">Assets</p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {assetCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              High / Critical Findings
            </p>

            <ShieldAlert className="h-5 w-5 text-red-500" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {highFindings}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Across assurance domains
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Medium Findings
            </p>

            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {mediumFindings}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Requiring contextual review
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Failed Domains</p>

            <ShieldAlert className="h-5 w-5 text-red-500" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {failedDomains}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Domains requiring investigation
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Warning Domains
            </p>

            <Activity className="h-5 w-5 text-amber-500" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {warningDomains}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Domains with elevated attention
          </p>
        </div>
      </section>

      {/* Domain Risk */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Assurance Domain Risk
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Risk context derived from the four assurance domains.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {result.domains.map((domain) => {
            const Icon = domainIcon(domain.domain);

            return (
              <div
                key={domain.domain}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-100 p-2.5">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {domainLabel(domain.domain)}
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Assurance score {domain.score}%
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${statusClasses(
                      domain.status,
                    )}`}
                  >
                    {domain.status}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Score</span>

                    <span className="font-semibold text-slate-900">
                      {domain.score}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-700"
                      style={{
                        width: `${domain.score}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {domain.summary}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    Confidence {domain.confidence}%
                  </span>

                  <a
                    href={`${domainPath(domain.domain)}?assessment=${assessment.id}`}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Investigate →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Findings */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            Risk-Contributing Findings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Findings contributing evidence to the current risk assessment.
          </p>
        </div>

        {result.domains.every((domain) => domain.findings.length === 0) ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />

            <p className="mt-3 text-sm font-medium text-slate-900">
              No findings recorded
            </p>

            <p className="mt-1 text-xs text-slate-500">
              No assurance findings are currently associated with this
              assessment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {result.domains.flatMap((domain) =>
              domain.findings.map((finding) => (
                <div key={finding.id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">
                          {finding.id}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${severityClasses(
                            finding.severity,
                          )}`}
                        >
                          {finding.severity}
                        </span>

                        <span className="text-xs text-slate-400">
                          {domainLabel(domain.domain)}
                        </span>
                      </div>

                      <h3 className="mt-2 font-semibold text-slate-900">
                        {finding.title}
                      </h3>

                      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                        {finding.description}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        Detection: {finding.detectionMethod}
                      </p>
                    </div>

                    <div className="shrink-0 text-left lg:text-right">
                      <p className="text-xs text-slate-400">Confidence</p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {finding.confidence}%
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        Affected samples
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {finding.affectedSamples.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )),
            )}
          </div>
        )}
      </section>

      {/* Recommendation */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              System Recommendation
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              The recommendation is derived from the available assurance result.
              The analyst should review the supporting findings, evidence,
              confidence, and limitations before recording a final disposition.
            </p>

            <div
              className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${dispositionClasses(
                result.recommendation,
              )}`}
            >
              {result.recommendation === "accept" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : result.recommendation === "review" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <ShieldAlert className="h-4 w-4" />
              )}
              Recommended Disposition: {dispositionLabel(result.recommendation)}
            </div>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto">
            {(["accept", "review", "quarantine"] as Disposition[]).map(
              (disposition) => (
                <button
                  key={disposition}
                  type="button"
                  onClick={() => {
                    setAnalystDecision(disposition);

                    recordRiskDecision({
                      assessmentId: assessment.id,
                      disposition,
                      decidedBy: "Assurance Analyst",
                      decidedAt: new Date().toISOString(),
                    });
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    analystDecision === disposition
                      ? dispositionClasses(disposition)
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {dispositionLabel(disposition)}
                </button>
              ),
            )}
          </div>
        </div>

        {analystDecision && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              Selected disposition: {dispositionLabel(analystDecision)}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              This selection is currently held in the frontend session.
              Persistent analyst decisions will be connected to the backend
              workflow later.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function RiskAssessmentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const assessmentId = searchParams.get("assessment");

  // Live sync (2026-10-27): previously this polled only the
  // localStorage cache, which the live engine never filled, so
  // risk stayed empty. Now it fetches assurance-lab results live.
  const assessments = useLiveAssessments();
  const { results, loading } = useLiveAssuranceResults();

  const contexts: AssessmentRiskContext[] = useMemo(
    () =>
      assessments.map((assessment) => ({
        assessment,
        result: results.find((r) => r.assessmentId === assessment.id),
      })),
    [assessments, results],
  );

  const selectedContext = useMemo(
    () => contexts.find((context) => context.assessment.id === assessmentId),
    [contexts, assessmentId],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading risk assessments...</p>
      </div>
    );
  }

  if (assessmentId && selectedContext) {
    return (
      <RiskReport
        context={selectedContext}
        onBack={() => setSearchParams({})}
      />
    );
  }

  return (
    <RiskOverview
      assessments={contexts}
      onSelect={(id) =>
        setSearchParams({
          assessment: id,
        })
      }
    />
  );
}
