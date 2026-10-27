import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Printer,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { loadAssessmentDetails } from "../../../controllers/assessmentController";
import { loadRiskDecision } from "../../../controllers/riskDecisionController";
import {
  domainLabel,
  fetchLiveReport,
  type LiveReport,
} from "../../../services/reportService";
import { ApiError } from "../../../api/client";

function riskClasses(risk: string) {
  if (risk === "low") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (risk === "high") return "bg-red-50 text-red-700 ring-red-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function statusIcon(status: string) {
  if (status === "pass") return <CheckCircle2 size={18} className="text-emerald-600" />;
  if (status === "fail") return <XCircle size={18} className="text-red-600" />;
  return <ShieldAlert size={18} className="text-amber-600" />;
}

function statusClasses(status: string) {
  if (status === "pass") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "fail") return "bg-red-50 text-red-700 ring-red-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function severityClasses(severity: string) {
  if (severity === "critical") return "bg-red-50 text-red-700 ring-red-200";
  if (severity === "high") return "bg-orange-50 text-orange-700 ring-orange-200";
  if (severity === "medium") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function scoreBar(score: number, status: string) {
  const color =
    status === "pass"
      ? "bg-emerald-500"
      : status === "fail"
        ? "bg-red-500"
        : "bg-amber-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
    </div>
  );
}

export default function AnalystReportDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<LiveReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchLiveReport(id)
      .then((r) => {
        if (!cancelled) setReport(r);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setError("Assessment not found.");
        } else if (err instanceof ApiError && err.status === 503) {
          setError(
            "No engine service returned a result for this assessment yet. Start the services (see services/README.md) and reopen this report.",
          );
        } else if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          // apiRequest already redirected to /login.
          setError("Session expired. Please log in again.");
        } else {
          setError("Could not load this report. Check that the backend is running and reopen it.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return <NotFound message="No assessment ID was given in the URL." />;
  }

  const details = loadAssessmentDetails(id);
  const decision = loadRiskDecision(id);

  if (!details) {
    return <NotFound message="This assessment is not in the local assessment list. Sync assessments from the backend, then reopen the report." />;
  }

  const { assessment, assets } = details;
  const findingCount = report
    ? report.domains.reduce((n, d) => n + d.findings.length, 0)
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/analyst/reports"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} /> Back to Reports
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Printer size={15} /> Print / Save as PDF
        </button>
      </div>

      {/* Report header — the document title block */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-950 px-6 py-4 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-sm font-bold">AI Assurance Platform</p>
            <p className="text-xs text-slate-400">
              Trustworthy Computer Vision Integrity Assurance · SIH 2026 · PS SIH26228
            </p>
          </div>
          <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
            Assurance Report
          </span>
        </div>

        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                RPT-{assessment.id}
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                Assessment {assessment.id}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {assessment.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Contributor: {assessment.contributorName} · Task: {assessment.task} · Use case: {assessment.useCase}
            </p>
            {report?.generatedAt && (
              <p className="mt-1 text-xs text-slate-400">
                Generated {new Date(report.generatedAt).toLocaleString()}
              </p>
            )}
          </div>
          {report && (
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase ring-1 ring-inset ${riskClasses(report.overallRisk)}`}>
                {report.overallRisk} risk
              </span>
              <span className="rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold uppercase text-white">
                {report.recommendation}
              </span>
            </div>
          )}
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Clock3 size={28} className="mx-auto animate-pulse text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Loading live report…</p>
          <p className="mt-1 text-sm text-slate-500">
            Calling the engine services through the backend assurance-lab.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <h2 className="font-semibold text-slate-900">Report not ready</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{error}</p>
              <p className="mt-2 text-sm text-slate-500">
                No result is invented in this case. Once the relevant service
                returns a result, reopening this page will show it.
              </p>
            </div>
          </div>
        </div>
      )}

      {report && (
        <>
          {/* Summary metrics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Overall Risk</p>
              <p className="mt-1 text-2xl font-bold capitalize text-slate-900">{report.overallRisk}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Confidence</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{report.overallConfidence}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Findings</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{findingCount}</p>
              <p className="text-xs text-slate-500">across {report.domains.length} domain{report.domains.length === 1 ? "" : "s"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recommendation</p>
              <p className="mt-1 text-2xl font-bold uppercase text-slate-900">{report.recommendation}</p>
            </div>
          </div>

          {/* Domains */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Domain results</h2>
            {report.domains.map((domain) => (
              <article key={domain.domain} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {statusIcon(domain.status)}
                    <div>
                      <h3 className="font-bold text-slate-900">{domainLabel(domain.domain)}</h3>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{domain.summary}</p>
                    </div>
                  </div>
                  <div className="w-full max-w-[220px]">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Score</span>
                      <span className="text-slate-900">{domain.score} / 100</span>
                    </div>
                    <div className="mt-2">{scoreBar(domain.score, domain.status)}</div>
                    <p className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span className={`rounded-full px-2 py-0.5 font-bold capitalize ring-1 ring-inset ${statusClasses(domain.status)}`}>
                        {domain.status}
                      </span>
                      <span>Confidence {domain.confidence}%</span>
                    </p>
                  </div>
                </div>

                {domain.findings.length > 0 && (
                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                    {domain.findings.map((finding) => (
                      <div key={finding.id} className="rounded-xl bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${severityClasses(finding.severity)}`}>
                            {finding.severity}
                          </span>
                          <p className="font-semibold text-slate-900">{finding.title}</p>
                        </div>
                        {finding.description && (
                          <p className="mt-2 text-sm leading-6 text-slate-600">{finding.description}</p>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          Confidence {finding.confidence}% · Affected samples: {finding.affectedSamples}
                          {finding.detectionMethod ? ` · Method: ${finding.detectionMethod}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {domain.findings.length === 0 && (
                  <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
                    No findings reported for this domain.
                  </p>
                )}
              </article>
            ))}
          </section>

          {/* Assets */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <Database size={18} className="text-blue-600" /> Assets in this assessment
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Only assets belonging to this assessment are listed here.
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {assets.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-500">
                  No assets submitted for this assessment yet.
                </p>
              )}
              {assets.map((asset) => (
                <div key={asset.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{asset.name}</p>
                    <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                      SHA-256: {asset.sha256 || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 font-bold capitalize text-blue-700">
                      {asset.type}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                      {asset.format}
                    </span>
                    <span className="text-slate-500">{asset.size}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold capitalize text-slate-600">
                      {asset.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Analyst decision */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Analyst decision</h2>
            {decision ? (
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>
                  Decision: <strong className="text-slate-900">{decision.disposition}</strong>
                </p>
                {decision.note && <p>Note: {decision.note}</p>}
                {decision.decidedBy && <p>Decided by: {decision.decidedBy} · {decision.decidedAt}</p>}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                No analyst decision recorded yet. Record one from the Risk
                Assessment page, then reopen this report to see it here.
              </p>
            )}
            <Link
              to="/analyst/risk"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 print:hidden"
            >
              Go to Risk Assessment
            </Link>
          </section>

          {/* Coverage note */}
          <p className="text-xs leading-5 text-slate-400">
            Coverage note: this report shows only domains for which an engine
            service returned a result. A domain whose service was unavailable
            is omitted, not shown as a pass. Scores are the engine services'
            scores, normalised to 0–100 for display.
          </p>
        </>
      )}
    </div>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <FileText size={32} className="mx-auto text-slate-400" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Report not found</h1>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <Link
          to="/analyst/reports"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <ArrowLeft size={16} /> Back to Reports
        </Link>
      </div>
    </div>
  );
}
