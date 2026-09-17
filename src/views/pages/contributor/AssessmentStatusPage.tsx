import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileArchive,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

import {
  loadAssessmentDetails,
} from '../../../controllers/assessmentController'

import type { Assessment } from '../../../models/assessment.model'
import type { Asset } from '../../../models/asset.model'
import type {
  ProcessingStatus,
} from '../../../models/processing.model'

import {
  getProcessingState,
} from '../../../services/processingService'

const STEPS: {
  status: ProcessingStatus
  label: string
}[] = [
  {
    status: 'submitted',
    label: 'Submitted',
  },
  {
    status: 'registering',
    label: 'Registering',
  },
  {
    status: 'queued',
    label: 'Queued',
  },
  {
    status: 'processing',
    label: 'Baseline Analysis',
  },
  {
    status: 'analysis_complete',
    label: 'Analysis Complete',
  },
  {
    status: 'analyst_review',
    label: 'Analyst Review',
  },
  {
    status: 'completed',
    label: 'Completed',
  },
]

function getStepIndex(
  status: ProcessingStatus,
) {
  if (status === 'failed') {
    return -1
  }

  return STEPS.findIndex(
    (step) =>
      step.status === status,
  )
}

function formatStatus(
  status: ProcessingStatus,
) {
  return status
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    )
}

function AssetRow({
  asset,
}: {
  asset: Asset
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
        <FileArchive
          size={19}
          className="text-slate-500"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {asset.name}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {asset.type.toUpperCase()} · {asset.format} · {asset.size}
        </p>
      </div>

      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        Submitted
      </span>
    </div>
  )
}

export default function AssessmentStatusPage() {
  const { id } = useParams()

  const [details, setDetails] = useState<
    ReturnType<typeof loadAssessmentDetails>
  >(undefined)

  const refresh = () => {
    if (!id) return

    setDetails(
      loadAssessmentDetails(id),
    )
  }

  useEffect(() => {
    refresh()

    const interval = window.setInterval(
      refresh,
      1000,
    )

    return () => {
      window.clearInterval(interval)
    }
  }, [id])

  const assessment =
    details?.assessment as Assessment | undefined

  const assets =
    details?.assets as Asset[] | undefined

  const processing =
    assessment
      ? getProcessingState(assessment)
      : undefined

  const activeStep =
    processing
      ? getStepIndex(processing.status)
      : -1

  const isFailed =
    processing?.status === 'failed'

  const statusText =
    processing
      ? formatStatus(processing.status)
      : 'Loading'

  const progressWidth =
    processing
      ? `${processing.progress}%`
      : '0%'

  const submittedAssetCount =
    useMemo(
      () => assets?.length ?? 0,
      [assets],
    )

  if (!assessment || !processing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <XCircle
            size={40}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Assessment not found
          </h2>

          <Link
            to="/contributor/assessments"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to My Assessments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          to="/contributor/assessments"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          My Assessments
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {assessment.name}
              </h1>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {assessment.id}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {assessment.task} · {assessment.useCase}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            {processing.status === 'processing' ? (
              <Loader2
                size={17}
                className="animate-spin text-blue-600"
              />
            ) : processing.status === 'analysis_complete' ||
              processing.status === 'analyst_review' ||
              processing.status === 'completed' ? (
              <CheckCircle2
                size={17}
                className="text-emerald-600"
              />
            ) : (
              <Clock3
                size={17}
                className="text-slate-500"
              />
            )}

            <span className="text-sm font-semibold text-slate-700">
              {statusText}
            </span>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Assurance Processing
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Automated baseline assurance runs after submission.
            </p>
          </div>

          <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-blue-50 sm:flex">
            <ShieldCheck
              size={20}
              className="text-blue-600"
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{processing.currentStep}</span>
            <span>{processing.progress}%</span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: progressWidth,
              }}
            />
          </div>
        </div>

        <div className="mt-10 overflow-x-auto pb-2">
          <div className="flex min-w-[760px] items-start">
            {STEPS.map((step, index) => {
              const complete =
                !isFailed &&
                index < activeStep

              const current =
                !isFailed &&
                index === activeStep

              return (
                <div
                  key={step.status}
                  className="flex flex-1 items-start"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                        complete
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : current
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-slate-200 bg-white text-slate-300'
                      }`}
                    >
                      {complete ? (
                        <CheckCircle2 size={17} />
                      ) : current ? (
                        <Activity size={17} />
                      ) : (
                        <span className="text-xs font-bold">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <p
                      className={`mt-2 whitespace-nowrap text-xs font-semibold ${
                        current || complete
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>

                  {index < STEPS.length - 1 && (
                    <div
                      className={`mt-4 h-0.5 flex-1 ${
                        complete
                          ? 'bg-blue-600'
                          : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {processing.status === 'analysis_complete' && (
          <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex gap-3">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Automated analysis completed
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  The assurance system has completed its baseline checks.
                  The assessment is now available to an Analyst for review.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Assessment
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs text-slate-500">
                Use Case
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {assessment.useCase}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Task
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {assessment.task}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Submitted
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {new Date(
                  assessment.createdAt,
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Submitted Assets
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {submittedAssetCount} asset
                {submittedAssetCount === 1 ? '' : 's'}
                registered with this assessment.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {assets?.length ? (
              assets.map((asset) => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                />
              ))
            ) : (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No assets registered yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
        <div className="flex gap-3">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>
            <p className="text-sm font-semibold text-slate-900">
              What happens next?
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              The system performs baseline dataset, model, inference,
              and distribution checks automatically. Analyst-only
              evidence, deeper testing, risk assessment, and final
              disposition remain in the Analyst workspace.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
