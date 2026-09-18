import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileWarning,
  ShieldCheck,
} from "lucide-react";

import { loadAssessmentDetails } from "../../../controllers/assessmentController";
import { loadRiskDecision } from "../../../controllers/riskDecisionController";
import { loadAssuranceResult } from "../../../services/assuranceService";

export default function ContributorReportDetailsPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <NotFound />;
  }

  const details = loadAssessmentDetails(id);
  const result = loadAssuranceResult(id);
  const decision = loadRiskDecision(id);

  if (!details || !result) {
    return <NotFound />;
  }

  const findingCount = result.domains.reduce(
    (total, domain) => total + domain.findings.length,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        to="/contributor/reports"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to Reports
      </Link>

      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                Assurance Report
              </span>

              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                RPT-{details.assessment.id}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-semibold text-slate-900">
              {details.assessment.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Assessment {details.assessment.id}
            </p>
          </div>

          <RiskBadge risk={result.overallRisk} />
        </div>
      </section>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Overall Risk" value={result.overallRisk} />

        <MetricCard label="Confidence" value={`${result.overallConfidence}%`} />

        <MetricCard label="Findings" value={findingCount} />

        <MetricCard label="Assets" value={details.assets.length} />
      </div>

      {/* Decision */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck size={21} className="mt-0.5 text-blue-600" />

          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">
              Assurance Disposition
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current system recommendation and analyst disposition.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-400">System Recommendation</p>

                <p className="mt-1 font-semibold capitalize text-slate-900">
                  {result.recommendation}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-400">Analyst Decision</p>

                <p className="mt-1 font-semibold capitalize text-slate-900">
                  {decision?.disposition ?? "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Domains */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Assurance Domains
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Results across the four assurance domains.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {result.domains.map((domain) => (
            <DomainCard key={domain.domain} domain={domain} />
          ))}
        </div>
      </section>

      {/* Findings */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Findings</h2>

          <p className="mt-1 text-xs text-slate-500">
            Findings included in this assurance result.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {findingCount === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckCircle2 size={30} className="mx-auto text-emerald-500" />

              <p className="mt-3 font-medium text-slate-700">
                No findings reported
              </p>
            </div>
          ) : (
            result.domains.flatMap((domain) =>
              domain.findings.map((finding) => (
                <div key={finding.id} className="px-5 py-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-slate-900">
                          {finding.title}
                        </h3>

                        <SeverityBadge severity={finding.severity} />
                      </div>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {finding.description}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-xs text-slate-400">Confidence</p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {finding.confidence}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>
                      Affected samples:{" "}
                      <strong className="text-slate-700">
                        {finding.affectedSamples.toLocaleString()}
                      </strong>
                    </span>

                    <span>
                      Method:{" "}
                      <strong className="text-slate-700">
                        {finding.detectionMethod}
                      </strong>
                    </span>
                  </div>
                </div>
              )),
            )
          )}
        </div>
      </section>
    </div>
  );
}

function DomainCard({
  domain,
}: {
  domain: ReturnType<typeof loadAssuranceResult> extends infer T
    ? T extends { domains: infer D }
      ? D extends Array<infer U>
        ? U
        : never
      : never
    : never;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">
            {formatDomain(domain.domain)}
          </p>

          <p className="mt-1 text-xs text-slate-500">{domain.summary}</p>
        </div>

        <span className="text-lg font-semibold text-slate-900">
          {domain.score}%
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{
            width: `${Math.max(0, Math.min(100, domain.score))}%`,
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Confidence {domain.confidence}%</span>

        <span className="capitalize">{domain.status}</span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-semibold capitalize text-slate-900">
        {value}
      </p>
    </div>
  );
}

function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  const classes = {
    low: "bg-emerald-50 text-emerald-700",
    medium: "bg-amber-50 text-amber-700",
    high: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${classes[risk]}`}
    >
      {risk} risk
    </span>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: "low" | "medium" | "high" | "critical";
}) {
  const classes = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-amber-50 text-amber-700",
    high: "bg-orange-50 text-orange-700",
    critical: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${classes[severity]}`}
    >
      {severity === "critical" && <AlertTriangle size={13} />}

      {severity}
    </span>
  );
}

function formatDomain(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function NotFound() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
      <FileWarning size={32} className="mx-auto text-slate-300" />

      <h1 className="mt-3 font-semibold text-slate-900">
        Report not available
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        The requested assurance report could not be found.
      </p>

      <Link
        to="/contributor/reports"
        className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Back to Reports
      </Link>
    </div>
  );
}
