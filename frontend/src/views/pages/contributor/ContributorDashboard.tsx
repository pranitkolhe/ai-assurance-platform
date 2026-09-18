import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  FileCheck2,
  ShieldAlert,
  Upload,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { loadAssessments } from "../../../controllers/assessmentController";
import { getAllAssets } from "../../../services/assessmentService";

export default function ContributorDashboard() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const allAssessments = loadAssessments();

  const assessments = allAssessments.filter(
    (assessment) => assessment.contributorId === user.id,
  );

  const allAssets = getAllAssets();

  const assets = allAssets.filter((asset) =>
    assessments.some((assessment) => assessment.id === asset.assessmentId),
  );

  const processingCount = assessments.filter(
    (assessment) =>
      assessment.status === "submitted" ||
      assessment.status === "registered" ||
      assessment.status === "analysis",
  ).length;

  const reviewCount = assessments.filter(
    (assessment) => assessment.status === "review",
  ).length;

  const completedCount = assessments.filter(
    (assessment) => assessment.status === "completed",
  ).length;

  const flaggedAssets = assets.filter(
    (asset) => asset.status === "flagged",
  ).length;

  const verifiedAssets = assets.filter(
    (asset) => asset.status === "verified",
  ).length;

  const recentAssessments = assessments.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Contributor Workspace
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Contributor Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Submit and track your AI assurance assets.
          </p>
        </div>

        <Link
          to="/contributor/submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Upload size={17} />
          Submit Assets
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="My Assessments"
          value={assessments.length}
          description="Your submitted assessments"
          icon={FileCheck2}
        />

        <StatCard
          title="Processing"
          value={processingCount}
          description="Currently being processed"
          icon={Activity}
        />

        <StatCard
          title="Under Review"
          value={reviewCount}
          description="Awaiting analyst review"
          icon={Clock3}
        />

        <StatCard
          title="Flagged Assets"
          value={flaggedAssets}
          description="Assets with findings"
          icon={ShieldAlert}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Recent Assessments
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Your latest assurance submissions
              </p>
            </div>

            <Link
              to="/contributor/assessments"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentAssessments.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <FileCheck2 size={30} className="mx-auto text-slate-300" />

                <p className="mt-3 font-medium text-slate-700">
                  No assessments yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Submit your first assessment to begin.
                </p>
              </div>
            ) : (
              recentAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-slate-900">
                        {assessment.name}
                      </p>

                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {assessment.id}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {assessment.task} · {assessment.useCase}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <RiskBadge risk={assessment.overallRisk} />

                    <StatusBadge status={assessment.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-semibold text-slate-900">Asset Overview</h2>

            <p className="mt-1 text-xs text-slate-500">
              Assets across your assessments
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <AssetSummary label="Total Assets" value={assets.length} />

            <AssetSummary
              label="Datasets"
              value={assets.filter((asset) => asset.type === "dataset").length}
            />

            <AssetSummary
              label="Models"
              value={assets.filter((asset) => asset.type === "model").length}
            />

            <AssetSummary
              label="Inference Records"
              value={
                assets.filter((asset) => asset.type === "inference").length
              }
            />

            <AssetSummary label="Verified Assets" value={verifiedAssets} />
          </div>

          <Link
            to="/contributor/assets"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Database size={16} />
            View My Assets
          </Link>
        </section>
      </div>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={20} className="mt-0.5 text-blue-600" />

          <div>
            <h2 className="font-semibold text-slate-900">Assurance Workflow</h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Submitted assets are registered and queued for assurance analysis.
              Analysts can review the assessment, assign suitable references,
              and investigate assurance findings.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <span>
          {completedCount} completed assessment
          {completedCount === 1 ? "" : "s"}
        </span>

        <span>
          {assets.length} total asset
          {assets.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>

        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function AssetSummary({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>

      <span className="font-semibold text-slate-900">{value}</span>
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
