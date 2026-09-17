import { useMemo } from 'react'
import {
  Link,
  useSearchParams,
} from 'react-router-dom'

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileWarning,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'

import {
  loadAssessmentDetails,
  loadAssessments,
} from '../../../controllers/assessmentController'

import {
  loadAssuranceResult,
} from '../../../controllers/assuranceController'

import type {
  AssuranceDomainResult,
} from '../../../models/assurance.model'

function statusLabel(
  status: AssuranceDomainResult['status'],
) {
  if (status === 'pass') return 'Pass'
  if (status === 'warning') return 'Warning'
  return 'Fail'
}

function statusClasses(
  status: AssuranceDomainResult['status'],
) {
  if (status === 'pass') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (status === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-red-200 bg-red-50 text-red-700'
}

function severityClasses(
  severity: string,
) {
  if (severity === 'critical') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  if (severity === 'high') {
    return 'border-orange-200 bg-orange-50 text-orange-700'
  }

  if (severity === 'medium') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function scoreClasses(
  score: number,
) {
  if (score >= 85) {
    return 'text-emerald-600'
  }

  if (score >= 70) {
    return 'text-amber-600'
  }

  return 'text-red-600'
}

export default function ModelIntegrityPage() {
  const [searchParams] =
    useSearchParams()

  const assessmentId =
    searchParams.get('assessment')

  /*
   * When opened from the sidebar, there is no
   * assessment selected yet. Show an assessment
   * selection page instead of "Assessment Not Found".
   */
  if (!assessmentId) {
    return <ModelIntegrityOverview />
  }

  return (
    <ModelIntegrityReport
      assessmentId={assessmentId}
    />
  )
}

function ModelIntegrityOverview() {
  const assessments =
    loadAssessments()

  const modelAssessments =
    useMemo(() => {
      return assessments.filter(
        (assessment) =>
          assessment.status !==
          'draft',
      )
    }, [assessments])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          Analyst Workspace
        </p>

        <div className="mt-1 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Cpu size={22} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Model Integrity
          </h1>
        </div>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Select an assessment to inspect its submitted model
          artifact and review model integrity findings.
        </p>
      </div>

      {modelAssessments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Cpu
            size={34}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            No assessments available
          </p>

          <p className="mt-1 text-sm text-slate-500">
            There are currently no assessments available
            for model integrity investigation.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {modelAssessments.map(
            (assessment) => {
              const details =
                loadAssessmentDetails(
                  assessment.id,
                )

              const modelAsset =
                details?.assets.find(
                  (asset) =>
                    asset.type ===
                    'model',
                )

              const assurance =
                loadAssuranceResult(
                  assessment.id,
                )

              const modelDomain =
                assurance?.domains.find(
                  (domain) =>
                    domain.domain ===
                    'model_integrity',
                )

              return (
                <div
                  key={assessment.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                          {assessment.id}
                        </span>

                        {modelAsset && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              modelAsset.status ===
                              'flagged'
                                ? 'bg-red-50 text-red-700'
                                : modelAsset.status ===
                                    'verified'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {modelAsset.status}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-3 text-base font-bold text-slate-900">
                        {assessment.name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {assessment.contributorName}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>
                          Model:{' '}
                          <strong className="text-slate-700">
                            {modelAsset?.name ??
                              'Not submitted'}
                          </strong>
                        </span>

                        <span>
                          Format:{' '}
                          <strong className="text-slate-700">
                            {modelAsset?.format ??
                              '—'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-5">
                      {modelDomain && (
                        <div className="text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Integrity Score
                          </p>

                          <p
                            className={`mt-1 text-2xl font-bold ${scoreClasses(modelDomain.score)}`}
                          >
                            {modelDomain.score}
                          </p>
                        </div>
                      )}

                      <Link
                        to={`/analyst/model-integrity?assessment=${assessment.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        Investigate
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            },
          )}
        </div>
      )}
    </div>
  )
}

function ModelIntegrityReport({
  assessmentId,
}: {
  assessmentId: string
}) {
  const details =
    loadAssessmentDetails(
      assessmentId,
    )

  const assurance =
    loadAssuranceResult(
      assessmentId,
    )

  const modelAsset =
    details?.assets.find(
      (asset) =>
        asset.type === 'model',
    )

  const modelDomain =
    assurance?.domains.find(
      (domain) =>
        domain.domain ===
        'model_integrity',
    )

  const metrics =
    modelDomain?.metrics ?? []

  const findings =
    modelDomain?.findings ?? []

  const summaryText =
    useMemo(() => {
      if (!modelAsset) {
        return 'Model Integrity analysis is unavailable because this assessment does not contain a submitted model artifact.'
      }

      if (!modelDomain) {
        return 'The model artifact is registered, but a Model Integrity assurance result is not available yet.'
      }

      return modelDomain.summary
    }, [
      modelAsset,
      modelDomain,
    ])

  if (!details?.assessment) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileWarning
            size={32}
            className="mx-auto text-slate-400"
          />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Assessment Not Found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The requested assessment could not be loaded.
          </p>

          <Link
            to="/analyst/model-integrity"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Model Integrity
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          to="/analyst/model-integrity"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Model Integrity
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Cpu size={22} />
          </div>

          <div>
            <p className="text-sm font-medium text-blue-600">
              Model Investigation
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Model Integrity
            </h1>
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          {details.assessment.name} ·{' '}
          {details.assessment.id}
        </p>
      </div>

      {!modelAsset ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <ShieldAlert size={21} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Model Integrity Unavailable
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                No model artifact was submitted with this assessment.
                Model-specific assurance checks cannot be performed
                without a model artifact.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Model Asset
              </p>

              <p className="mt-2 truncate text-base font-bold text-slate-900">
                {modelAsset.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {modelAsset.id}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Format
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {modelAsset.format}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Submitted model artifact
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Asset Status
              </p>

              <p className="mt-2 text-xl font-bold capitalize text-slate-900">
                {modelAsset.status}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Current registered asset state
              </p>
            </div>
          </section>

          {modelDomain ? (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        size={19}
                        className="text-blue-600"
                      />

                      <h2 className="text-base font-bold text-slate-900">
                        Model Integrity Summary
                      </h2>
                    </div>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      {summaryText}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-8">
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Integrity Score
                      </p>

                      <p
                        className={`mt-1 text-4xl font-bold ${scoreClasses(modelDomain.score)}`}
                      >
                        {modelDomain.score}
                      </p>

                      <p className="text-xs text-slate-400">
                        / 100
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Confidence
                      </p>

                      <p className="mt-1 text-3xl font-bold text-slate-900">
                        {modelDomain.confidence}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${statusClasses(modelDomain.status)}`}
                  >
                    {statusLabel(
                      modelDomain.status,
                    )}
                  </span>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Cpu
                    size={19}
                    className="text-blue-600"
                  />

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Technical Checks
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Model-specific assurance measurements and analysis results.
                    </p>
                  </div>
                </div>

                {metrics.length > 0 ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {metrics.map(
                      (metric) => (
                        <div
                          key={metric.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {metric.name}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {metric.description}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${statusClasses(metric.status)}`}
                            >
                              {metric.status}
                            </span>
                          </div>

                          <div className="mt-4 flex items-end justify-between">
                            <span className="text-xs text-slate-400">
                              Measurement
                            </span>

                            <span className="text-2xl font-bold text-slate-900">
                              {metric.value}
                              {metric.unit
                                ? ` ${metric.unit}`
                                : ''}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    No model integrity metrics are currently available.
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    size={19}
                    className="text-amber-600"
                  />

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Model Findings
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Findings requiring analyst attention.
                    </p>
                  </div>
                </div>

                {findings.length > 0 ? (
                  <div className="mt-5 space-y-4">
                    {findings.map(
                      (finding) => (
                        <article
                          key={finding.id}
                          className="rounded-xl border border-slate-200 p-5"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900">
                                  {finding.title}
                                </h3>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${severityClasses(finding.severity)}`}
                                >
                                  {finding.severity}
                                </span>
                              </div>

                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                {finding.description}
                              </p>
                            </div>

                            <div className="shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-right">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Confidence
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-900">
                                {finding.confidence}%
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Detection Method
                              </p>

                              <p className="mt-1 text-xs font-medium text-slate-700">
                                {finding.detectionMethod}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Affected Samples
                              </p>

                              <p className="mt-1 text-xs font-medium text-slate-700">
                                {finding.affectedSamples}
                              </p>
                            </div>
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                    <CheckCircle2
                      size={20}
                      className="text-emerald-600"
                    />

                    <p className="text-sm font-medium text-emerald-800">
                      No model integrity findings were generated.
                    </p>
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3">
                <ShieldAlert
                  size={20}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <div>
                  <h2 className="text-sm font-bold text-amber-900">
                    Analysis Result Unavailable
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    The model artifact is registered, but a Model Integrity
                    assurance result is not available for this assessment yet.
                  </p>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
