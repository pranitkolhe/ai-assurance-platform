import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Database,
  FileCheck2,
  FileText,
  Search,
  ShieldCheck,
} from "lucide-react";

import { useLiveAssessments } from "../../../controllers/assessmentController";
import { getAssetsForAssessment } from "../../../services/assessmentService";
import { loadAssuranceResult } from "../../../services/assuranceService";

type RiskFilter = "all" | "low" | "medium" | "high";

function riskBadge(risk: string) {
  if (risk === "low") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (risk === "high") return "bg-red-50 text-red-700 ring-red-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function assetTypeLabel(type: string) {
  if (type === "dataset") return "Dataset";
  if (type === "model") return "Model";
  return "Inference";
}

export default function AnalystReportsPage() {
  const assessments = useLiveAssessments();
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assessments
      .map((assessment) => {
        const assets = getAssetsForAssessment(assessment.id);
        const stored = loadAssuranceResult(assessment.id);
        return { assessment, assets, stored };
      })
      .filter(({ assessment, stored }) => {
        if (q) {
          const hay = `${assessment.name} ${assessment.id} ${assessment.contributorName}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (riskFilter !== "all" && stored?.overallRisk !== riskFilter) {
          return false;
        }
        return true;
      });
  }, [assessments, query, riskFilter]);

  const readyCount = rows.filter((r) => Boolean(r.stored)).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-blue-600">Analyst Workspace</p>
        <div className="mt-1 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText size={22} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reports
          </h1>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          One assurance report per assessment, built from the live engine
          results — domain scores, findings, evidence and the final
          disposition. Open a report to see the full document.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assessments</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{assessments.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reports with a stored result</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{readyCount}</p>
          <p className="mt-1 text-xs text-slate-500">
            A report is always generated live when you open it, even if
            no stored result is shown here yet.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <ShieldCheck size={14} /> How a report is built
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Domain scores come from the standalone services (8101–8105)
            via the backend assurance-lab. Nothing is hard-coded: if no
            engine returned a result, the report says so instead of
            showing a pass.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by assessment name, ID or contributor…"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "low", "medium", "high"] as RiskFilter[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRiskFilter(r)}
              className={`rounded-full px-3.5 py-2 text-xs font-bold capitalize transition ${
                riskFilter === r
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {r === "all" ? "All risks" : r}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText size={32} className="mx-auto text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700">No reports match</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a different search, or clear the risk filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map(({ assessment, assets, stored }) => (
            <div
              key={assessment.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      {assessment.id}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-600">
                      {assessment.status}
                    </span>
                    {stored && (
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${riskBadge(stored.overallRisk)}`}>
                        {stored.overallRisk} risk
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 truncate text-base font-bold text-slate-900">
                    {assessment.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {assessment.contributorName} · {assessment.task}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {assets.length === 0 && (
                      <span className="text-xs text-slate-400">No assets submitted yet</span>
                    )}
                    {assets.map((asset) => (
                      <span
                        key={asset.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"
                      >
                        <Database size={12} />
                        {assetTypeLabel(asset.type)} · {asset.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-5">
                  {stored && (
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Confidence</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {stored.overallConfidence}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {stored.domains.length} domain{stored.domains.length === 1 ? "" : "s"} · {" "}
                        {stored.domains.reduce((n, d) => n + d.findings.length, 0)} findings
                      </p>
                    </div>
                  )}
                  <Link
                    to={`/analyst/reports/${assessment.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Open report <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <FileCheck2 size={14} />
        Contributor reports live at /contributor/reports and show the same
        assessment document, scoped to that contributor's own assessments.
      </p>
    </div>
  );
}
