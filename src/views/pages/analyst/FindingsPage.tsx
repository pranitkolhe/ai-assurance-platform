import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

import { loadAssessments } from "../../../controllers/assessmentController";
import assuranceResults from "../../../data/assurance-results.json";

import type { AssuranceResult } from "../../../models/assurance.model";
import type { Severity } from "../../../models/finding.model";

interface FindingRow {
  id: string;
  assessmentId: string;
  assessmentName: string;
  title: string;
  description: string;
  severity: Severity;
  confidence: number;
  affectedSamples: number;
  detectionMethod: string;
  domain: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  data_integrity: "Data Integrity",
  model_integrity: "Model Integrity",
  inference_verification: "Inference Verification",
  distribution_analysis: "Distribution Analysis",
};

function getSeverityClass(severity: Severity) {
  if (severity === "critical") {
    return "bg-red-100 text-red-800 ring-1 ring-inset ring-red-200";
  }

  if (severity === "high") {
    return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
  }

  if (severity === "medium") {
    return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200";
}

function getSeverityIconClass(severity: Severity) {
  if (severity === "critical" || severity === "high") {
    return "bg-red-50 text-red-600";
  }

  if (severity === "medium") {
    return "bg-amber-50 text-amber-600";
  }

  return "bg-slate-100 text-slate-500";
}

function getDomainPath(domain: string, assessmentId: string) {
  if (domain === "data_integrity") {
    return `/analyst/data-integrity?assessment=${assessmentId}`;
  }

  if (domain === "model_integrity") {
    return `/analyst/model-integrity?assessment=${assessmentId}`;
  }

  if (domain === "inference_verification") {
    return `/analyst/inference-verification?assessment=${assessmentId}`;
  }

  return `/analyst/distribution-analysis?assessment=${assessmentId}`;
}

export default function FindingsPage() {
  const assessments = loadAssessments();
  const results = assuranceResults as AssuranceResult[];

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");

  const findings = useMemo<FindingRow[]>(() => {
    const rows: FindingRow[] = [];

    for (const result of results) {
      const assessment = assessments.find(
        (item) => item.id === result.assessmentId,
      );

      for (const domain of result.domains) {
        for (const finding of domain.findings) {
          rows.push({
            id: finding.id,
            assessmentId: result.assessmentId,
            assessmentName: assessment?.name ?? result.assessmentId,
            title: finding.title,
            description: finding.description,
            severity: finding.severity,
            confidence: finding.confidence,
            affectedSamples: finding.affectedSamples,
            detectionMethod: finding.detectionMethod,
            domain: domain.domain,
          });
        }
      }
    }

    return rows;
  }, [assessments, results]);

  const filteredFindings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return findings.filter((finding) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        finding.id.toLowerCase().includes(normalizedSearch) ||
        finding.title.toLowerCase().includes(normalizedSearch) ||
        finding.assessmentId.toLowerCase().includes(normalizedSearch) ||
        finding.assessmentName.toLowerCase().includes(normalizedSearch) ||
        finding.detectionMethod.toLowerCase().includes(normalizedSearch);

      const matchesSeverity =
        severityFilter === "all" || finding.severity === severityFilter;

      const matchesDomain =
        domainFilter === "all" || finding.domain === domainFilter;

      return matchesSearch && matchesSeverity && matchesDomain;
    });
  }, [findings, search, severityFilter, domainFilter]);

  const criticalCount = findings.filter(
    (finding) => finding.severity === "critical",
  ).length;

  const highCount = findings.filter(
    (finding) => finding.severity === "high",
  ).length;

  const mediumCount = findings.filter(
    (finding) => finding.severity === "medium",
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}

      <section>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Analyst Assurance
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Findings
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Review assurance findings across all analyzed assessments and
              navigate directly to the evidence-producing assurance domain.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <ShieldAlert size={18} className="text-blue-600" />

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Total Findings
              </p>

              <p className="text-lg font-bold text-slate-900">
                {findings.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            All Findings
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {findings.length}
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
            Critical
          </p>

          <p className="mt-2 text-3xl font-bold text-red-700">
            {criticalCount}
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
            High
          </p>

          <p className="mt-2 text-3xl font-bold text-red-700">{highCount}</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Medium
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-700">
            {mediumCount}
          </p>
        </div>
      </section>

      {/* Filters */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search findings, assessments, methods..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-slate-400" />

              <select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <select
              value={domainFilter}
              onChange={(event) => setDomainFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Domains</option>
              <option value="data_integrity">Data Integrity</option>
              <option value="model_integrity">Model Integrity</option>
              <option value="inference_verification">
                Inference Verification
              </option>
              <option value="distribution_analysis">
                Distribution Analysis
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-700">
              {filteredFindings.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-700">{findings.length}</span>{" "}
            findings
          </p>

          {(search || severityFilter !== "all" || domainFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSeverityFilter("all");
                setDomainFilter("all");
              }}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Findings list */}

      {filteredFindings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={23} />
          </div>

          <h2 className="mt-4 text-sm font-bold text-slate-800">
            No findings match your filters
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
            Try changing the search term, severity, or assurance domain.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFindings.map((finding) => (
            <article
              key={finding.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getSeverityIconClass(
                      finding.severity,
                    )}`}
                  >
                    <AlertTriangle size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">
                        {finding.id}
                      </span>

                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                        {DOMAIN_LABELS[finding.domain] ?? finding.domain}
                      </span>
                    </div>

                    <h2 className="mt-2 text-sm font-bold text-slate-900">
                      {finding.title}
                    </h2>

                    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
                      {finding.description}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 self-start rounded-full px-3 py-1.5 text-[11px] font-bold capitalize ${getSeverityClass(
                    finding.severity,
                  )}`}
                >
                  {finding.severity}
                </span>
              </div>

              <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Assessment
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {finding.assessmentId}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {finding.assessmentName}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Confidence
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {finding.confidence}%
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Affected Samples
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {finding.affectedSamples}
                  </p>
                </div>

                <div className="sm:col-span-2 xl:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Detection Method
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {finding.detectionMethod}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                <Link
                  to={getDomainPath(finding.domain, finding.assessmentId)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Investigate Finding
                  <ChevronRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
