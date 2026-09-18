import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  ShieldAlert,
  Target,
} from "lucide-react";

import { loadAssessments } from "../../../controllers/assessmentController";
import { loadFlaggedImage } from "../../../controllers/flaggedImageController";

function severityClass(severity: string) {
  if (severity === "critical" || severity === "high") {
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

export default function FlaggedImageDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const image = id ? loadFlaggedImage(id) : undefined;
  const assessments = loadAssessments();

  if (!image) {
    return (
      <div className="space-y-6">
        <Link
          to="/analyst/flagged-images"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Flagged Images
        </Link>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <AlertTriangle size={32} className="mx-auto text-amber-500" />

          <h2 className="mt-4 text-base font-bold text-slate-800">
            Flagged Image Not Found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            The requested flagged sample could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const assessment = assessments.find((item) => item.id === image.assessmentId);

  return (
    <div className="space-y-8">
      {/* Back */}

      <Link
        to="/analyst/flagged-images"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        Back to Flagged Images
      </Link>

      {/* Header */}

      <section>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                {image.id}
              </span>

              <span className="text-xs text-slate-400">
                Visual Investigation
              </span>
              <span className="text-xs text-slate-400">
                Visual Investigation
              </span>

              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {image.domain === "data_integrity"
                  ? "Data Integrity"
                  : image.domain === "model_integrity"
                    ? "Model Integrity"
                    : image.domain === "inference_verification"
                      ? "Inference Verification"
                      : "Distribution Analysis"}
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {image.findingTitle}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {image.assessmentId}
              {assessment ? ` · ${assessment.name}` : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <span
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold capitalize ${severityClass(
                image.severity,
              )}`}
            >
              {image.severity}
            </span>

            <span
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold capitalize ${statusClass(
                image.status,
              )}`}
            >
              {image.status}
            </span>
          </div>
        </div>
      </section>

      {/* Main investigation */}

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        {/* Image */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-base font-bold text-slate-900">
              Flagged Sample
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Visual representation of the sample associated with this finding.
            </p>
          </div>

          <div className="bg-slate-950 p-4 sm:p-6">
            <img
              src={image.imagePath}
              alt={image.imageName}
              className="mx-auto max-h-[620px] w-full rounded-xl object-contain"
            />
          </div>

          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Image
            </p>

            <p className="mt-1 text-sm font-bold text-slate-800">
              {image.imageName}
            </p>
          </div>
        </div>

        {/* Finding */}

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <ShieldAlert size={20} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Finding
                </p>

                <h2 className="mt-1 text-sm font-bold text-slate-900">
                  {image.findingTitle}
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-500">
              {image.description}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">
              Detection Context
            </h2>

            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <Target size={17} className="mt-0.5 shrink-0 text-blue-500" />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Detection Method
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {image.detectionMethod}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileCheck2
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-500"
                />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Confidence
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {image.confidence}%
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-500"
                />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Investigation Status
                  </p>

                  <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                    {image.status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample information */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-base font-bold text-slate-900">
            Sample Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Traceability information associated with the flagged sample.
          </p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Image ID
            </p>

            <p className="mt-2 text-sm font-bold text-slate-800">{image.id}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Assessment
            </p>

            <p className="mt-2 text-sm font-bold text-slate-800">
              {image.assessmentId}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Asset
            </p>

            <p className="mt-2 text-sm font-bold text-slate-800">
              {image.assetId}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Finding
            </p>

            <p className="mt-2 text-sm font-bold text-slate-800">
              {image.findingId}
            </p>
          </div>
        </div>
      </section>

      {/* Label comparison */}

      {(image.expectedLabel || image.observedLabel) && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-base font-bold text-slate-900">
              Label Context
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Label information available for this flagged sample.
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Expected Label
              </p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {image.expectedLabel ?? "Unavailable"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Observed Label
              </p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {image.observedLabel ?? "Unavailable"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Related investigation */}

      <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-slate-900">
              Continue investigation
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Open the assurance domain that produced this flagged sample.
            </p>
          </div>

          <Link
            to={
              image.domain === "data_integrity"
                ? `/analyst/data-integrity?assessment=${image.assessmentId}`
                : image.domain === "model_integrity"
                  ? `/analyst/model-integrity?assessment=${image.assessmentId}`
                  : image.domain === "inference_verification"
                    ? `/analyst/inference-verification?assessment=${image.assessmentId}`
                    : `/analyst/distribution-analysis?assessment=${image.assessmentId}`
            }
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
          >
            Open Assessment Investigation
          </Link>
        </div>
      </section>
    </div>
  );
}
