import { useMemo, useState } from "react";
import {
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { loadEvidence } from "../../../controllers/evidenceController";
import { loadAssessments } from "../../../controllers/assessmentController";
import { getAssuranceResults } from "../../../services/assuranceService";

import type { Evidence } from "../../../models/evidence.model";

interface EvidenceContext {
  evidence: Evidence;
  findingTitle: string;
  assessmentId: string;
  assessmentName: string;
  domain: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  data_integrity: "Data Integrity",
  model_integrity: "Model Integrity",
  inference_verification: "Inference Verification",
  distribution_analysis: "Distribution Analysis",
};

function domainLabel(domain: string) {
  return DOMAIN_LABELS[domain] ?? domain;
}

export default function EvidencePage() {
  const assessments = loadAssessments();
  const evidenceRecords = loadEvidence();
  const results = getAssuranceResults();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");

  const evidenceContext = useMemo<EvidenceContext[]>(() => {
    const rows: EvidenceContext[] = [];

    for (const result of results) {
      const assessment = assessments.find(
        (item) => item.id === result.assessmentId,
      );

      for (const domain of result.domains) {
        for (const finding of domain.findings) {
          const relatedEvidence = evidenceRecords.filter(
            (item) => item.findingId === finding.id,
          );

          for (const evidenceItem of relatedEvidence) {
            rows.push({
              evidence: evidenceItem,
              findingTitle: finding.title,
              assessmentId: result.assessmentId,
              assessmentName: assessment?.name ?? result.assessmentId,
              domain: domain.domain,
            });
          }
        }
      }
    }

    return rows;
  }, [assessments, evidenceRecords, results]);

  const evidenceTypes = useMemo(() => {
    return Array.from(
      new Set(evidenceContext.map((item) => item.evidence.type)),
    );
  }, [evidenceContext]);

  const filteredEvidence = useMemo(() => {
    const query = search.trim().toLowerCase();

    return evidenceContext.filter((item) => {
      const evidence = item.evidence;

      const matchesSearch =
        query.length === 0 ||
        evidence.id.toLowerCase().includes(query) ||
        evidence.findingId.toLowerCase().includes(query) ||
        evidence.type.toLowerCase().includes(query) ||
        evidence.description.toLowerCase().includes(query) ||
        evidence.value.toLowerCase().includes(query) ||
        evidence.source.toLowerCase().includes(query) ||
        item.assessmentId.toLowerCase().includes(query) ||
        item.assessmentName.toLowerCase().includes(query) ||
        item.findingTitle.toLowerCase().includes(query);

      const matchesType = typeFilter === "all" || evidence.type === typeFilter;

      const matchesDomain =
        domainFilter === "all" || item.domain === domainFilter;

      return matchesSearch && matchesType && matchesDomain;
    });
  }, [evidenceContext, search, typeFilter, domainFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}

      <section>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Analyst Investigation
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Evidence
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Review the technical evidence supporting assurance findings across
              datasets, models, inference records, and distribution analysis.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Fingerprint size={19} className="text-blue-600" />

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Evidence Records
              </p>

              <p className="text-lg font-bold text-slate-900">
                {evidenceContext.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Evidence
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {evidenceContext.length}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Evidence Types
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-700">
            {evidenceTypes.length}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Linked Findings
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {
              new Set(evidenceContext.map((item) => item.evidence.findingId))
                .size
            }
          </p>
        </div>
      </section>

      {/* Filters */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search evidence, findings, assessments..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Evidence Types</option>

            {evidenceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

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

            <option value="distribution_analysis">Distribution Analysis</option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <SlidersHorizontal size={14} />
          Showing{" "}
          <span className="font-bold text-slate-700">
            {filteredEvidence.length}
          </span>{" "}
          of{" "}
          <span className="font-bold text-slate-700">
            {evidenceContext.length}
          </span>{" "}
          evidence records
          {(search || typeFilter !== "all" || domainFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
                setDomainFilter("all");
              }}
              className="ml-auto font-bold text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Evidence */}

      {filteredEvidence.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CheckCircle2 size={32} className="mx-auto text-emerald-500" />

          <h2 className="mt-4 text-sm font-bold text-slate-800">
            No evidence found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            No evidence records match the current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvidence.map((item) => {
            const evidence = item.evidence;

            return (
              <article
                key={evidence.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileCheck2 size={20} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400">
                          {evidence.id}
                        </span>

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                          {domainLabel(item.domain)}
                        </span>
                      </div>

                      <h2 className="mt-2 text-sm font-bold text-slate-900">
                        {evidence.type}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {evidence.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-3 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Confidence
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {evidence.confidence}%
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Finding
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {evidence.findingId}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.findingTitle}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Assessment
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {item.assessmentId}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {item.assessmentName}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Source
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {evidence.source}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Evidence Value
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {evidence.value}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Technical note */}

      <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Evidence and provenance
            </h2>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              This view is the analyst-facing evidence layer. Cryptographic
              hashes, signatures, provenance records, preprocessing identifiers,
              sequence information, and other technical verification artifacts
              can be attached here when produced by the assurance engine.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
