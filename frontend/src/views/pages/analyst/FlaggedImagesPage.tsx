import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, Search, SlidersHorizontal } from "lucide-react";

import { useLiveAssessments } from "../../../controllers/assessmentController";
import { useLiveAssuranceResults } from "../../../services/liveAssuranceService";

import type { Severity } from "../../../models/finding.model";
import type { FlaggedImage } from "../../../models/flaggedImage.model";

function severityClass(severity: Severity) {
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

function statusClass(status: string) {
  if (status === "open") {
    return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
  }

  if (status === "reviewed") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200";
}

export default function FlaggedImagesPage() {
  const assessments = useLiveAssessments();
  const { results } = useLiveAssuranceResults();

  // Derive flagged images from live findings (2026-10-27):
  // previously this read only assure_flagged_images in localStorage,
  // which nothing ever wrote. Each affected asset name in a finding
  // becomes one flagged image row. Findings with no affected assets
  // (e.g. unknown image id) have no file to show, so they are skipped.
  const flaggedImages: FlaggedImage[] = useMemo(() => {
    const rows: FlaggedImage[] = [];
    for (const result of results) {
      for (const domain of result.domains) {
        for (const finding of domain.findings) {
          for (const assetName of finding.affectedAssets ?? []) {
            const base = assetName.split("/").pop() ?? assetName;
            rows.push({
              id: `${result.assessmentId}-${finding.id}-${base}`,
              assessmentId: result.assessmentId,
              assetId: "",
              findingId: finding.id,
              domain: domain.domain,
              imageName: base,
              imagePath: assetName,
              findingTitle: finding.title,
              description: finding.description,
              severity: finding.severity,
              confidence: finding.confidence,
              detectionMethod: finding.detectionMethod,
              status: "open",
            });
          }
        }
      }
    }
    return rows;
  }, [results]);

  // Keep the detail page working: it reads assure_flagged_images
  // from localStorage, so mirror the live-derived rows there.
  useEffect(() => {
    try {
      localStorage.setItem("assure_flagged_images", JSON.stringify(flaggedImages));
    } catch {
      // ignore storage errors, list above still renders
    }
  }, [flaggedImages]);

  const [search, setSearch] = useState("");
  const [assessmentFilter, setAssessmentFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const assessmentNames = useMemo(() => {
    return new Map(
      assessments.map((assessment) => [assessment.id, assessment.name]),
    );
  }, [assessments]);

  const filteredImages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return flaggedImages.filter((image) => {
      const matchesSearch =
        query.length === 0 ||
        image.id.toLowerCase().includes(query) ||
        image.imageName.toLowerCase().includes(query) ||
        image.findingTitle.toLowerCase().includes(query) ||
        image.assessmentId.toLowerCase().includes(query) ||
        image.detectionMethod.toLowerCase().includes(query);

      const matchesAssessment =
        assessmentFilter === "all" || image.assessmentId === assessmentFilter;

      const matchesSeverity =
        severityFilter === "all" || image.severity === severityFilter;

      const matchesStatus =
        statusFilter === "all" || image.status === statusFilter;

      return (
        matchesSearch && matchesAssessment && matchesSeverity && matchesStatus
      );
    });
  }, [flaggedImages, search, assessmentFilter, severityFilter, statusFilter]);

  const criticalCount = flaggedImages.filter(
    (image) => image.severity === "critical",
  ).length;

  const highCount = flaggedImages.filter(
    (image) => image.severity === "high",
  ).length;

  const openCount = flaggedImages.filter(
    (image) => image.status === "open",
  ).length;

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
              Flagged Images
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Visually investigate samples associated with assurance findings
              and review the context behind suspicious computer-vision data.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Eye size={18} className="text-blue-600" />

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Flagged Samples
              </p>

              <p className="text-lg font-bold text-slate-900">
                {flaggedImages.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {flaggedImages.length}
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

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Open Review
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-700">{openCount}</p>
        </div>
      </section>

      {/* Filters */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search image, finding, assessment..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={assessmentFilter}
            onChange={(event) => setAssessmentFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Assessments</option>

            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.id}
              </option>
            ))}
          </select>

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

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <SlidersHorizontal size={14} />
          Showing{" "}
          <span className="font-bold text-slate-700">
            {filteredImages.length}
          </span>{" "}
          of{" "}
          <span className="font-bold text-slate-700">
            {flaggedImages.length}
          </span>{" "}
          flagged samples
          {(search ||
            assessmentFilter !== "all" ||
            severityFilter !== "all" ||
            statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setAssessmentFilter("all");
                setSeverityFilter("all");
                setStatusFilter("all");
              }}
              className="ml-auto font-bold text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Gallery */}

      {filteredImages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CheckCircle2 size={32} className="mx-auto text-emerald-500" />

          <h2 className="mt-4 text-sm font-bold text-slate-800">
            No flagged images found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            No samples match the current investigation filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredImages.map((image: FlaggedImage) => (
            <article
              key={image.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <img
                  src={image.imagePath}
                  alt={image.imageName}
                  className="h-full w-full object-cover"
                />

                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize backdrop-blur ${severityClass(
                    image.severity,
                  )}`}
                >
                  {image.severity}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400">
                      {image.id}
                    </p>

                    <h2 className="mt-1 truncate text-sm font-bold text-slate-900">
                      {image.findingTitle}
                    </h2>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${statusClass(
                      image.status,
                    )}`}
                  >
                    {image.status}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                  {image.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Assessment
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-700">
                      {image.assessmentId}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Confidence
                    </p>

                    <p className="mt-1 text-xs font-bold text-slate-700">
                      {image.confidence}%
                    </p>
                  </div>
                </div>

                <p className="mt-3 truncate text-xs text-slate-500">
                  {assessmentNames.get(image.assessmentId) ??
                    image.assessmentId}
                </p>

                <Link
                  to={`/analyst/flagged-images/${image.id}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                  <Eye size={14} />
                  Investigate Image
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
