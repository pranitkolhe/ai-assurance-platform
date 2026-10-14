import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Eye, Search } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { useLiveAssessments } from "../../../controllers/assessmentController";

export default function MyAssessmentsPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const allAssessments = useLiveAssessments();


  const myAssessments = useMemo(() => {
    if (!user) {
      return [];
    }

    return allAssessments.filter(
      (assessment) => assessment.contributorId === user.id,
    );
  }, [allAssessments, user]);

  const filteredAssessments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return myAssessments.filter((assessment) => {
      const matchesSearch =
        !query ||
        assessment.id.toLowerCase().includes(query) ||
        assessment.name.toLowerCase().includes(query) ||
        assessment.task.toLowerCase().includes(query) ||
        assessment.useCase.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || assessment.status === statusFilter;

      const matchesRisk =
        riskFilter === "all" || assessment.overallRisk === riskFilter;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [myAssessments, search, statusFilter, riskFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Contributor Workspace
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            My Assessments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and track all assurance assessments submitted by you.
          </p>
        </div>

        <Link
          to="/contributor/submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Submit New Assessment
        </Link>
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_180px]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assessments..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>

            <option value="draft">Draft</option>

            <option value="submitted">Submitted</option>

            <option value="registered">Registered</option>

            <option value="analysis">Analysis</option>

            <option value="review">Review</option>

            <option value="completed">Completed</option>
          </select>

          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
          >
            <option value="all">All Risk Levels</option>

            <option value="low">Low Risk</option>

            <option value="medium">Medium Risk</option>

            <option value="high">High Risk</option>
          </select>
        </div>
      </section>

      {/* List */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Assessment List</h2>

          <p className="mt-1 text-xs text-slate-500">
            {filteredAssessments.length} assessment
            {filteredAssessments.length === 1 ? "" : "s"} shown
          </p>
        </div>

        {filteredAssessments.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <ClipboardList size={34} className="mx-auto text-slate-300" />

            <p className="mt-3 font-medium text-slate-700">
              No assessments found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Submit an assessment or change your filters.
            </p>

            <Link
              to="/contributor/submit"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Submit Assets
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAssessments.map((assessment) => (
              <div
                key={assessment.id}
                className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {assessment.name}
                    </h3>

                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                      {assessment.id}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {assessment.task}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {assessment.useCase}
                  </p>

                  {assessment.processing && (
                    <div className="mt-3 max-w-md">
                      <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                        <span>{assessment.processing.currentStep}</span>

                        <span>{assessment.processing.progress}%</span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{
                            width: `${assessment.processing.progress}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <RiskBadge risk={assessment.overallRisk} />

                  <StatusBadge status={assessment.status} />

                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    Confidence {assessment.confidence}%
                  </span>

                  <Link
                    to={`/analyst/assessments/${assessment.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eye size={15} />
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
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
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${classes[risk]}`}
    >
      {risk} risk
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
      {status.replace("_", " ")}
    </span>
  );
}
