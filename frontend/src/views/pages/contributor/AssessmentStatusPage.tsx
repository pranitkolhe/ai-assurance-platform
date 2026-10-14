import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import { useLiveAssessments } from "../../../controllers/assessmentController";
import { loadRiskDecision } from "../../../controllers/riskDecisionController";
import { loadAssuranceResult } from "../../../controllers/assuranceController";

import type { Assessment } from "../../../models/assessment.model";
import type { RiskDecision } from "../../../models/riskDecision.model";

import { useAuth } from "../../../context/AuthContext";

type StatusFilter = "all" | Assessment["status"];

type RiskFilter = "all" | Assessment["overallRisk"];

type DecisionFilter = "all" | RiskDecision["disposition"] | "pending";


function decisionLabel(disposition: RiskDecision["disposition"]): string {
  switch (disposition) {
    case "accept":
      return "Accepted";
    case "review":
      return "Under Review";
    case "quarantine":
      return "Quarantined";
  }
}

function decisionClasses(disposition: RiskDecision["disposition"]): string {
  switch (disposition) {
    case "accept":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "review":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "quarantine":
      return "border-red-200 bg-red-50 text-red-700";
  }
}

function decisionIcon(disposition: RiskDecision["disposition"]) {
  switch (disposition) {
    case "accept":
      return CheckCircle2;
    case "review":
      return Clock3;
    case "quarantine":
      return ShieldAlert;
  }
}

function statusLabel(status: Assessment["status"]): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "review":
      return "Under Review";
    case "analysis":
      return "Analysis";
    case "submitted":
      return "Submitted";
    case "registered":
      return "Registered";
    case "draft":
      return "Draft";
    default:
      return status;
  }
}

function statusClasses(status: Assessment["status"]): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "review":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "analysis":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "submitted":
    case "registered":
      return "border-slate-200 bg-slate-50 text-slate-600";
    case "draft":
      return "border-slate-200 bg-slate-50 text-slate-500";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function riskClasses(risk: Assessment["overallRisk"]): string {
  switch (risk) {
    case "high":
      return "border-red-200 bg-red-50 text-red-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function AssessmentStatusPage() {
  const { user } = useAuth();
  const allAssessments = useLiveAssessments();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [decisions, setDecisions] = useState<Record<string, RiskDecision>>({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAssessments([]);
      setDecisions({});
      setLoading(false);
      return;
    }

    const contributorAssessments = allAssessments.filter(
      (assessment: Assessment) => assessment.contributorId === user.id,
    );

    setAssessments(contributorAssessments);

    const nextDecisions: Record<string, RiskDecision> = {};
    contributorAssessments.forEach((assessment: Assessment) => {
      const decision = loadRiskDecision(assessment.id);
      if (decision) {
        nextDecisions[assessment.id] = decision;
      }
    });

    setDecisions(nextDecisions);
    setLoading(false);
  }, [allAssessments, user]);


  const filteredAssessments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assessments.filter((assessment) => {
      const assuranceResult = loadAssuranceResult(assessment.id);

      const risk = assuranceResult?.overallRisk ?? assessment.overallRisk;

      const decision = decisions[assessment.id];

      const matchesSearch =
        !query ||
        assessment.id.toLowerCase().includes(query) ||
        assessment.name.toLowerCase().includes(query) ||
        assessment.task.toLowerCase().includes(query) ||
        assessment.useCase.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || assessment.status === statusFilter;

      const matchesRisk = riskFilter === "all" || risk === riskFilter;

      const matchesDecision =
        decisionFilter === "all" ||
        (decisionFilter === "pending" && !decision) ||
        decision?.disposition === decisionFilter;

      return matchesSearch && matchesStatus && matchesRisk && matchesDecision;
    });
  }, [
    assessments,
    decisions,
    search,
    statusFilter,
    riskFilter,
    decisionFilter,
  ]);

  const summary = useMemo(() => {
    const total = assessments.length;

    const completed = assessments.filter(
      (assessment) => assessment.status === "completed",
    ).length;

    const processing = assessments.filter(
      (assessment) =>
        assessment.status === "analysis" ||
        assessment.status === "submitted" ||
        assessment.status === "registered",
    ).length;

    const underReview = assessments.filter(
      (assessment) =>
        assessment.status === "review" ||
        decisions[assessment.id]?.disposition === "review",
    ).length;

    const accepted = Object.values(decisions).filter(
      (decision) => decision.disposition === "accept",
    ).length;

    const quarantined = Object.values(decisions).filter(
      (decision) => decision.disposition === "quarantine",
    ).length;

    return {
      total,
      completed,
      processing,
      underReview,
      accepted,
      quarantined,
    };
  }, [assessments, decisions]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setRiskFilter("all");
    setDecisionFilter("all");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    riskFilter !== "all" ||
    decisionFilter !== "all";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading assessment status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Assessment Status
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Track submitted assessments, assurance progress, risk, and analyst
          disposition.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Assessments"
          value={summary.total}
          icon={Activity}
        />

        <SummaryCard
          label="Processing"
          value={summary.processing}
          icon={Clock3}
        />

        <SummaryCard
          label="Under Review"
          value={summary.underReview}
          icon={AlertTriangle}
        />

        <SummaryCard
          label="Completed"
          value={summary.completed}
          icon={CheckCircle2}
        />
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assessment, ID, task, or use case..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="registered">Registered</option>
            <option value="analysis">Analysis</option>
            <option value="review">Under Review</option>
            <option value="completed">Completed</option>
          </select>

          {/* Risk */}
          <select
            value={riskFilter}
            onChange={(event) =>
              setRiskFilter(event.target.value as RiskFilter)
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          {/* Analyst Decision */}
          <select
            value={decisionFilter}
            onChange={(event) =>
              setDecisionFilter(event.target.value as DecisionFilter)
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="all">All Decisions</option>
            <option value="pending">Awaiting Decision</option>
            <option value="accept">Accepted</option>
            <option value="review">Under Review</option>
            <option value="quarantine">Quarantined</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <Filter className="h-3.5 w-3.5" />
          Showing {filteredAssessments.length} of {assessments.length}{" "}
          assessments
        </div>
      </section>

      {/* Empty State */}
      {assessments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Activity className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 font-semibold text-slate-900">
            No assessments found
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            You have not submitted an assessment yet. Once you submit assets,
            their assurance status will appear here.
          </p>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Filter className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 font-semibold text-slate-900">
            No matching assessments
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Try changing the search or filters.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Assessment Cards */
        <div className="grid gap-4">
          {filteredAssessments.map((assessment) => {
            const decision = decisions[assessment.id];

            const assuranceResult = loadAssuranceResult(assessment.id);

            const displayRisk =
              assuranceResult?.overallRisk ?? assessment.overallRisk;

            const displayConfidence =
              assuranceResult?.overallConfidence ?? assessment.confidence;

            const DecisionIcon = decision
              ? decisionIcon(decision.disposition)
              : Clock3;

            return (
              <AssessmentStatusCard
                key={assessment.id}
                assessment={assessment}
                decision={decision}
                risk={displayRisk}
                confidence={displayConfidence}
                assuranceAvailable={Boolean(assuranceResult)}
                DecisionIcon={DecisionIcon}
              />
            );
          })}
        </div>
      )}

      {/* Information */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

        <div>
          <p className="text-sm font-semibold">Assessment workflow</p>

          <p className="mt-1 text-xs leading-5">
            Assessment status shows the processing stage of your submission.
            Analyst disposition separately shows whether the reviewed assessment
            was accepted, placed under review, or quarantined.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>

        <Icon className="h-5 w-5 text-slate-400" />
      </div>

      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function AssessmentStatusCard({
  assessment,
  decision,
  risk,
  confidence,
  assuranceAvailable,
  DecisionIcon,
}: {
  assessment: Assessment;
  decision?: RiskDecision;
  risk: Assessment["overallRisk"];
  confidence: number;
  assuranceAvailable: boolean;
  DecisionIcon: typeof Clock3;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-400">
              {assessment.id}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                assessment.status,
              )}`}
            >
              {statusLabel(assessment.status)}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${riskClasses(
                risk,
              )}`}
            >
              {risk} risk
            </span>
          </div>

          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            {assessment.name}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {assessment.task} · {assessment.useCase}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Created {formatDate(assessment.createdAt)}
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-400">Confidence</p>

            <p className="mt-1 font-semibold text-slate-900">
              {confidence > 0 ? `${confidence}%` : "Pending"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-400">Assurance</p>

            <p className="mt-1 font-semibold text-slate-900">
              {assuranceAvailable ? "Available" : "Pending"}
            </p>
          </div>
        </div>
      </div>

      {/* Processing Progress */}
      {assessment.processing && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Assurance Processing
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {assessment.processing.currentStep}
              </p>
            </div>

            <span className="text-sm font-semibold text-slate-900">
              {assessment.processing.progress}%
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-700 transition-all"
              style={{
                width: `${assessment.processing.progress}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Analyst Decision */}
      <div className="mt-5 border-t border-slate-100 pt-5">
        {decision ? (
          <div
            className={`rounded-xl border p-4 ${decisionClasses(
              decision.disposition,
            )}`}
          >
            <div className="flex items-start gap-3">
              <DecisionIcon className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="text-sm font-semibold">
                  Analyst Disposition: {decisionLabel(decision.disposition)}
                </p>

                <p className="mt-1 text-xs opacity-80">
                  Decision recorded by {decision.decidedBy} on{" "}
                  {formatDate(decision.decidedAt)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

              <div>
                <p className="text-sm font-medium text-slate-700">
                  Awaiting analyst disposition
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  No final Accept, Review, or Quarantine decision has been
                  recorded yet.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
