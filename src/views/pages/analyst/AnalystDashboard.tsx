import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileSearch,
  ShieldAlert,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { loadAnalystDashboard } from "../../../controllers/dashboardController";
import type { Severity } from "../../../models/finding.model";

const riskClasses = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
};

const severityClasses: Record<Severity, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    submitted: "Submitted",
    analysis: "Analysis",
    review: "Review",
    completed: "Completed",
  };

  return labels[status] ?? status;
}

export default function AnalystDashboard() {
  const data = useMemo(() => loadAnalystDashboard(), []);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Assurance Operations
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Analyst Dashboard
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Monitor active assurance assessments, investigate findings, and
            review evidence-backed integrity risks.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
          <Activity size={15} />
          Assurance environment
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat, index) => {
          const icons = [ShieldCheck, ShieldAlert, Clock3, CheckCircle2];

          const Icon = icons[index];

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {stat.value}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
                  <Icon size={20} />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">{stat.description}</p>

              {stat.trend && (
                <p className="mt-1 text-xs font-medium text-blue-600">
                  {stat.trend}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Assessment Queue */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="font-semibold text-slate-950">Assessment Queue</h3>

              <p className="mt-1 text-xs text-slate-500">
                Recent assurance assessments requiring attention
              </p>
            </div>

            <Link
              to="/analyst/assessments"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Assessment</th>
                  <th className="px-5 py-3">Contributor</th>
                  <th className="px-5 py-3">Assets</th>
                  <th className="px-5 py-3">Risk</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                </tr>
              </thead>

              <tbody>
                {data.queue.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">{item.id}</p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.contributor}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.assets}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${riskClasses[item.risk]}`}
                      >
                        {item.risk}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-slate-600">
                        {getStatusLabel(item.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-400">
                      {item.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Assurance Summary */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6">
            <h3 className="font-semibold text-slate-950">Assurance Coverage</h3>

            <p className="mt-1 text-xs text-slate-500">
              Current verification coverage across assurance modules
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                label: "Data Integrity",
                value: data.assuranceSummary.dataIntegrity,
              },
              {
                label: "Model Integrity",
                value: data.assuranceSummary.modelIntegrity,
              },
              {
                label: "Inference Verification",
                value: data.assuranceSummary.inferenceVerification,
              },
              {
                label: "Distribution Analysis",
                value: data.assuranceSummary.distributionAnalysis,
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {item.label}
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {item.value}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-900">
              Assurance status
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              Multiple verification layers are active across current
              assessments.
            </p>
          </div>
        </section>
      </div>

      {/* Findings */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-950">Recent Findings</h3>

            <p className="mt-1 text-xs text-slate-500">
              Latest evidence-backed integrity findings
            </p>
          </div>

          <button className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <FileSearch size={16} />
            Investigate
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          {data.findings.map((finding) => (
            <div
              key={finding.id}
              className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                  <AlertTriangle size={17} />
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold capitalize ${severityClasses[finding.severity]}`}
                >
                  {finding.severity}
                </span>
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-900">
                {finding.title}
              </p>

              <p className="mt-1 text-xs text-slate-500">{finding.type}</p>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Confidence</span>
                  <span className="font-semibold text-slate-700">
                    {finding.confidence}%
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Asset</span>
                  <span className="font-medium text-slate-700">
                    {finding.asset}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Finding</span>
                  <span className="font-medium text-slate-700">
                    {finding.id}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
