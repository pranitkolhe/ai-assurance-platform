import { useMemo, useState } from "react";
import { ArrowRight, ClipboardList, Search } from "lucide-react";

import { loadAssessments } from "../../../controllers/assessmentController";
import { useAuth } from "../../../context/AuthContext";

import type { Assessment } from "../../../models/assessment.model";

function getStatusClasses(status: Assessment["status"]) {
  switch (status) {
    case "submitted":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "registered":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "analysis":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "review":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getRiskClasses(risk: Assessment["overallRisk"]) {
  switch (risk) {
    case "high":
      return "bg-red-50 text-red-700 border-red-200";

    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "low":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function formatStatus(status: Assessment["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatRisk(risk: Assessment["overallRisk"]) {
  return risk.charAt(0).toUpperCase() + risk.slice(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function MyAssessmentsPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    Assessment["status"] | "all"
  >("all");

  const assessments = loadAssessments();

  const myAssessments = useMemo(() => {
    if (!user) {
      return [];
    }

    return assessments.filter(
      (assessment) => assessment.contributorId === user.id,
    );
  }, [assessments, user]);

  const filteredAssessments = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return myAssessments.filter((assessment) => {
      const matchesSearch =
        !normalizedSearch ||
        assessment.name.toLowerCase().includes(normalizedSearch) ||
        assessment.id.toLowerCase().includes(normalizedSearch) ||
        assessment.task.toLowerCase().includes(normalizedSearch) ||
        assessment.useCase.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || assessment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [myAssessments, search, statusFilter]);

  const submittedCount = myAssessments.filter(
    (assessment) => assessment.status === "submitted",
  ).length;

  const activeCount = myAssessments.filter(
    (assessment) =>
      assessment.status === "registered" ||
      assessment.status === "analysis" ||
      assessment.status === "review",
  ).length;

  const completedCount = myAssessments.filter(
    (assessment) => assessment.status === "completed",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Contributor Workspace
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            My Assessments
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Track the assurance assessments you have submitted and review their
            current workflow status.
          </p>
        </div>

        <a
          href="/contributor/submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          New Assessment
          <ArrowRight size={16} />
        </a>
      </div>

      {/* Summary */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Total Assessments
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {myAssessments.length}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Submitted by your account
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Active
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {activeCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Currently in assurance workflow
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {completedCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Assurance runs completed
          </p>
        </div>
      </div>

      {/* Filters */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assessments..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as Assessment["status"] | "all",
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Statuses</option>

            <option value="submitted">Submitted</option>

            <option value="registered">Registered</option>

            <option value="analysis">Analysis</option>

            <option value="review">Review</option>

            <option value="completed">Completed</option>
          </select>
        </div>
      </section>

      {/* Assessment List */}

      {filteredAssessments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <ClipboardList size={25} />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            {myAssessments.length === 0
              ? "No assessments yet"
              : "No matching assessments"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {myAssessments.length === 0
              ? "Create your first assurance assessment and submit the required computer-vision assets."
              : "Try changing the search term or status filter."}
          </p>

          {myAssessments.length === 0 && (
            <a
              href="/contributor/submit"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Create Assessment
              <ArrowRight size={16} />
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssessments.map((assessment) => (
            <div
              key={assessment.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Main */}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {assessment.id}
                    </span>

                    <span
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                        assessment.status,
                      )}`}
                    >
                      {formatStatus(assessment.status)}
                    </span>

                    <span
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${getRiskClasses(
                        assessment.overallRisk,
                      )}`}
                    >
                      {formatRisk(assessment.overallRisk)} risk
                    </span>
                  </div>

                  <h2 className="mt-3 truncate text-lg font-bold text-slate-900">
                    {assessment.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {assessment.useCase}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                    <span>
                      <strong className="font-semibold text-slate-700">
                        Task:
                      </strong>{" "}
                      {assessment.task}
                    </span>

                    <span>
                      <strong className="font-semibold text-slate-700">
                        Created:
                      </strong>{" "}
                      {formatDate(assessment.createdAt)}
                    </span>

                    {assessment.confidence > 0 && (
                      <span>
                        <strong className="font-semibold text-slate-700">
                          Confidence:
                        </strong>{" "}
                        {assessment.confidence}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}

                <div className="shrink-0">
                  <a
                    href={`/contributor/assessments/${assessment.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 lg:w-auto"
                  >
                    View Assessment
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submission information */}

      {submittedCount > 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          You have <strong>{submittedCount}</strong> newly submitted assessment
          {submittedCount === 1 ? "" : "s"} awaiting assurance workflow
          processing.
        </div>
      )}
    </div>
  );
}
