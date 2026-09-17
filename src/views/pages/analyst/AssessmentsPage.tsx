import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { loadAssessments } from "../../../controllers/assessmentController";
import type {
  Assessment,
  AssessmentStatus,
} from "../../../models/assessment.model";

function RiskBadge({ risk }: { risk: Assessment["overallRisk"] }) {
  const styles = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    high: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles[risk]}`}
    >
      {risk} risk
    </span>
  );
}

function StatusBadge({ status }: { status: Assessment["status"] }) {
  const styles: Record<AssessmentStatus, string> = {
    draft: "bg-slate-100 text-slate-600",
    submitted: "bg-slate-100 text-slate-700",
    registered: "bg-blue-50 text-blue-700",
    analysis: "bg-indigo-50 text-indigo-700",
    review: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function AssessmentsPage() {
  const assessments = loadAssessments();

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        assessment.name.toLowerCase().includes(searchValue) ||
        assessment.id.toLowerCase().includes(searchValue) ||
        assessment.contributorName.toLowerCase().includes(searchValue) ||
        assessment.task.toLowerCase().includes(searchValue);

      const matchesRisk =
        riskFilter === "all" || assessment.overallRisk === riskFilter;

      const matchesStatus =
        statusFilter === "all" || assessment.status === statusFilter;

      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [assessments, search, riskFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ClipboardList size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Assessments
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage all assurance assessments.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search assessments, contributors, tasks..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal size={17} className="text-slate-400" />

            <select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="all">All Risks</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="registered">Registered</option>
              <option value="analysis">Analysis</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Count */}
      <div>
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-900">
            {filteredAssessments.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-900">
            {assessments.length}
          </span>{" "}
          assessments
        </p>
      </div>

      {/* Assessment List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filteredAssessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <ClipboardList size={24} />
            </div>

            <h3 className="text-base font-semibold text-slate-900">
              No assessments found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filter settings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAssessments.map((assessment) => (
              <Link
                key={assessment.id}
                to={`/analyst/assessments/${assessment.id}`}
                className="block px-5 py-5 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Assessment Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {assessment.name}
                      </h3>

                      <RiskBadge risk={assessment.overallRisk} />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                      <span>{assessment.id}</span>

                      <span>Contributor: {assessment.contributorName}</span>

                      <span>Task: {assessment.task}</span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {assessment.useCase}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Status
                      </p>

                      <StatusBadge status={assessment.status} />
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Confidence
                      </p>

                      <p className="text-sm font-semibold text-slate-900">
                        {assessment.confidence}%
                      </p>
                    </div>

                    <ArrowRight size={18} className="text-slate-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
