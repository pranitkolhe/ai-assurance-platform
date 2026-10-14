import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { useLiveAssessments } from "../../../controllers/assessmentController";
import { loadRiskDecision } from "../../../controllers/riskDecisionController";
import { loadAssuranceResult } from "../../../services/assuranceService";
import type { Assessment } from "../../../models/assessment.model";


export default function ContributorReportsPage() {
  const { user } = useAuth();

  const assessments = useLiveAssessments();


  const myAssessments = useMemo(() => {
    if (!user) return [];

    return assessments.filter(
      (assessment) => assessment.contributorId === user.id,
    );
  }, [assessments, user]);

  const reportableAssessments = myAssessments.filter((assessment) => {
    const result = loadAssuranceResult(assessment.id);
    return Boolean(result);
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          Contributor Workspace
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Reports</h1>

        <p className="mt-1 text-sm text-slate-500">
          Review assurance results associated with your assessments.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="mt-0.5 text-blue-600" />

          <div>
            <h2 className="font-semibold text-slate-900">Assurance Reports</h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Reports summarize the available assurance analysis, findings,
              confidence, risk, and analyst disposition for your submitted
              assessments.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Assessments" value={myAssessments.length} />

        <Summary
          label="Reports Available"
          value={reportableAssessments.length}
        />

        <Summary
          label="Pending Reports"
          value={myAssessments.length - reportableAssessments.length}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Available Reports</h2>

          <p className="mt-1 text-xs text-slate-500">
            Assurance reports for your submitted assessments
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {reportableAssessments.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <FileText size={32} className="mx-auto text-slate-300" />

              <p className="mt-3 font-medium text-slate-700">
                No reports available yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Reports will appear when assurance results are available for
                your assessments.
              </p>
            </div>
          ) : (
            reportableAssessments.map((assessment) => (
              <ReportRow key={assessment.id} assessment={assessment} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ReportRow({
  assessment,
}: {
  assessment: Assessment;
}) {

  const result = loadAssuranceResult(assessment.id);
  const decision = loadRiskDecision(assessment.id);

  if (!result) {
    return null;
  }

  const findingCount = result.domains.reduce(
    (total, domain) => total + domain.findings.length,
    0,
  );

  return (
    <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <FileText size={19} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{assessment.name}</h3>

            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              RPT-{assessment.id}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {assessment.id} · {findingCount} finding
            {findingCount === 1 ? "" : "s"}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <RiskBadge risk={result.overallRisk} />

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              Confidence {result.overallConfidence}%
            </span>

            <DispositionBadge
              disposition={decision?.disposition ?? result.recommendation}
              isAnalystDecision={Boolean(decision)}
            />
          </div>
        </div>
      </div>

      <Link
        to={`/contributor/reports/${assessment.id}`}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        View Report
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
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

function DispositionBadge({
  disposition,
  isAnalystDecision,
}: {
  disposition: "accept" | "review" | "quarantine";
  isAnalystDecision: boolean;
}) {
  const config = {
    accept: {
      className: "bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    },
    review: {
      className: "bg-amber-50 text-amber-700",
      icon: AlertTriangle,
    },
    quarantine: {
      className: "bg-red-50 text-red-700",
      icon: AlertTriangle,
    },
  };

  const item = config[disposition];
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${item.className}`}
    >
      <Icon size={13} />

      {isAnalystDecision ? `Analyst: ${disposition}` : `System: ${disposition}`}
    </span>
  );
}
