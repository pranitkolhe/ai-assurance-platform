import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Database,
  FileCheck2,
  FileText,
  ShieldAlert,
} from "lucide-react";

import { loadAssessmentDetails } from "../../../controllers/assessmentController";

import { loadAssuranceResult } from "../../../controllers/assuranceController";

import { getProcessingState } from "../../../services/processingService";

import type { Asset } from "../../../models/asset.model";
import type { AssuranceDomain } from "../../../models/assurance.model";

function assetIcon(type: Asset["type"]) {
  if (type === "dataset") {
    return <Database size={19} />;
  }

  if (type === "model") {
    return <ShieldAlert size={19} />;
  }

  return <FileCheck2 size={19} />;
}

function domainLabel(domain: AssuranceDomain) {
  switch (domain) {
    case "data_integrity":
      return "Data Integrity";
    case "model_integrity":
      return "Model Integrity";
    case "inference_verification":
      return "Inference Verification";
    case "distribution_analysis":
      return "Distribution Analysis";
  }
}

function domainIcon(domain: AssuranceDomain) {
  switch (domain) {
    case "data_integrity":
      return <Database size={18} />;
    case "model_integrity":
      return <ShieldAlert size={18} />;
    case "inference_verification":
      return <FileCheck2 size={18} />;
    case "distribution_analysis":
      return <Activity size={18} />;
  }
}

export default function AssessmentDetailsPage() {
  const { id } = useParams();

  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  if (!id) {
    return null;
  }

  const details = loadAssessmentDetails(id);

  const assurance = loadAssuranceResult(id);

  if (!details) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          Assessment not found
        </h2>

        <Link
          to="/analyst/assessments"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Assessments
        </Link>
      </div>
    );
  }

  const { assessment, assets } = details;

  const processing = getProcessingState(assessment);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Link
          to="/analyst/assessments"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Assessments
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {assessment.name}
              </h1>

              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-500">
                {assessment.id}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {assessment.contributorName} · {assessment.task} ·{" "}
              {assessment.useCase}
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            <Activity size={15} />
            {processing.currentStep}
          </span>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">
                Automated Assurance Processing
              </span>

              <span className="font-bold text-slate-900">
                {processing.progress}%
              </span>
            </div>

            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{
                  width: `${processing.progress}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Status
            </p>

            <p className="mt-1 text-sm font-bold capitalize text-slate-900">
              {processing.status.replaceAll("_", " ")}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Submitted Assets
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              All artifacts registered against this assessment.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {assets.length} assets
          </span>
        </div>

        {assets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <FileText size={35} className="mx-auto text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No assets registered
            </p>

            <p className="mt-1 text-sm text-slate-500">
              This assessment does not currently have any registered artifacts.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {assets.map((asset) => {
              const investigationPath =
                asset.type === "dataset"
                  ? `/analyst/data-integrity?assessment=${assessment.id}`
                  : asset.type === "model"
                    ? `/analyst/model-integrity?assessment=${assessment.id}`
                    : `/analyst/inference-verification?assessment=${assessment.id}`;

              const investigationLabel =
                asset.type === "dataset"
                  ? "Investigate Dataset"
                  : asset.type === "model"
                    ? "Investigate Model"
                    : "Verify Inference";

              return (
                <div
                  key={asset.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      {assetIcon(asset.type)}
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        asset.status === "flagged"
                          ? "bg-red-50 text-red-700"
                          : asset.status === "verified"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {asset.status}
                    </span>
                  </div>

                  <h3 className="mt-4 truncate text-sm font-bold text-slate-900">
                    {asset.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {asset.type.toUpperCase()} · {asset.format}
                  </p>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-500">Size</p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {asset.size}
                    </p>
                  </div>

                  <Link
                    to={investigationPath}
                    className={`mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                      asset.status === "flagged"
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {investigationLabel} →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Assurance Domains
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Automated baseline results available for analyst investigation.
          </p>
        </div>

        {!assurance ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Activity size={35} className="mx-auto text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Assurance results are not available yet
            </p>

            <p className="mt-1 text-sm text-slate-500">
              The automated processing pipeline has not produced results for
              this assessment.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assurance.domains.map((domain) => {
              const domainPath =
                domain.domain === "data_integrity"
                  ? `/analyst/data-integrity?assessment=${assessment.id}`
                  : domain.domain === "model_integrity"
                    ? `/analyst/model-integrity?assessment=${assessment.id}`
                    : domain.domain === "inference_verification"
                      ? `/analyst/inference-verification?assessment=${assessment.id}`
                      : `/analyst/distribution-analysis?assessment=${assessment.id}`;
              return (
                <div
                  key={domain.domain}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      {domainIcon(domain.domain)}
                    </div>

                    <span className="text-2xl font-bold text-slate-900">
                      {domain.score}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-900">
                    {domainLabel(domain.domain)}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {domain.summary}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Confidence {domain.confidence}%
                    </span>

                    <Link
                      to={domainPath}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Investigate →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {processing.status === "analyst_review" && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex gap-3">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-blue-600" />

            <div>
              <h3 className="text-sm font-bold text-blue-900">
                Automated baseline analysis complete
              </h3>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                The system has completed baseline assurance checks. This
                assessment is now ready for Analyst investigation.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
