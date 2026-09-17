import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Search,
  ShieldAlert,
} from 'lucide-react'

import { loadAssessments } from '../../../controllers/assessmentController'
import { getProcessingState } from '../../../services/processingService'

import type { Assessment } from '../../../models/assessment.model'
import type { ProcessingStatus } from '../../../models/processing.model'

function riskClass(
  risk: Assessment['overallRisk'],
) {
  if (risk === 'high') {
    return 'bg-red-50 text-red-700 border-red-200'
  }

  if (risk === 'medium') {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  return 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

function processingLabel(
  status: ProcessingStatus,
) {
  switch (status) {
    case 'submitted':
      return 'Submitted'
    case 'registering':
      return 'Registering Assets'
    case 'queued':
      return 'Queued'
    case 'processing':
      return 'Processing'
    case 'analysis_complete':
      return 'Needs Analyst Review'
    case 'analyst_review':
      return 'Analyst Review'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Processing Failed'
  }
}

function processingClass(
  status: ProcessingStatus,
) {
  if (
    status === 'analysis_complete' ||
    status === 'analyst_review'
  ) {
    return 'bg-blue-50 text-blue-700 border-blue-200'
  }

  if (status === 'completed') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  if (status === 'failed') {
    return 'bg-red-50 text-red-700 border-red-200'
  }

  if (status === 'processing') {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function ProcessingIcon({
  status,
}: {
  status: ProcessingStatus
}) {
  if (
    status === 'analysis_complete' ||
    status === 'analyst_review'
  ) {
    return <ShieldAlert size={15} />
  }

  if (status === 'completed') {
    return <CheckCircle2 size={15} />
  }

  if (status === 'processing') {
    return <Activity size={15} />
  }

  return <Clock3 size={15} />
}

export default function AssessmentQueuePage() {
  const [, setTick] =
    useState(0)

  const [search, setSearch] =
    useState('')

  const [riskFilter, setRiskFilter] =
    useState<
      'all' | 'low' | 'medium' | 'high'
    >('all')

  useEffect(() => {
    const refresh = () => {
      setTick((value) => value + 1)
    }

    const interval =
      window.setInterval(
        refresh,
        1000,
      )

    window.addEventListener(
      'assurance:assessment-updated',
      refresh,
    )

    return () => {
      window.clearInterval(interval)

      window.removeEventListener(
        'assurance:assessment-updated',
        refresh,
      )
    }
  }, [])

  const assessments =
    loadAssessments()

  const queue =
    useMemo(() => {
      return assessments
        .filter((assessment) => {
          const status =
            getProcessingState(
              assessment,
            ).status

          return status !== 'completed'
        })
        .filter((assessment) => {
          const value =
            search
              .trim()
              .toLowerCase()

          if (!value) return true

          return [
            assessment.name,
            assessment.id,
            assessment.contributorName,
            assessment.task,
            assessment.useCase,
          ].some((field) =>
            field
              .toLowerCase()
              .includes(value),
          )
        })
        .filter((assessment) => {
          if (
            riskFilter === 'all'
          ) {
            return true
          }

          return (
            assessment.overallRisk ===
            riskFilter
          )
        })
    }, [
      assessments,
      search,
      riskFilter,
    ])

  const needsReview =
    assessments.filter(
      (assessment) => {
        const status =
          getProcessingState(
            assessment,
          ).status

        return (
          status ===
            'analysis_complete' ||
          status ===
            'analyst_review'
        )
      },
    ).length

  const processingCount =
    assessments.filter(
      (assessment) =>
        getProcessingState(
          assessment,
        ).status ===
        'processing',
    ).length

  const queuedCount =
    assessments.filter(
      (assessment) => {
        const status =
          getProcessingState(
            assessment,
          ).status

        return (
          status === 'queued' ||
          status === 'registering'
        )
      },
    ).length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          Analyst Workspace
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Assessment Queue
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Monitor automated assurance processing and review
          assessments that require analyst attention.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-800">
              Needs Analyst Review
            </p>

            <ShieldAlert
              size={20}
              className="text-blue-600"
            />
          </div>

          <p className="mt-3 text-3xl font-bold text-blue-900">
            {needsReview}
          </p>

          <p className="mt-1 text-xs text-blue-700">
            Automated baseline analysis completed
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">
              Currently Processing
            </p>

            <Activity
              size={20}
              className="text-amber-600"
            />
          </div>

          <p className="mt-3 text-3xl font-bold text-amber-900">
            {processingCount}
          </p>

          <p className="mt-1 text-xs text-amber-700">
            Automatic assurance checks running
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">
              Waiting to Process
            </p>

            <Clock3
              size={20}
              className="text-slate-400"
            />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {queuedCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Registered and waiting in the queue
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search assessment, contributor, task..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(event) =>
              setRiskFilter(
                event.target.value as
                  | 'all'
                  | 'low'
                  | 'medium'
                  | 'high',
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              All Risk Levels
            </option>
            <option value="high">
              High Risk
            </option>
            <option value="medium">
              Medium Risk
            </option>
            <option value="low">
              Low Risk
            </option>
          </select>
        </div>
      </section>

      <section className="space-y-3">
        {queue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <CheckCircle2
              size={40}
              className="mx-auto text-emerald-500"
            />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No assessments require attention
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              New submissions will automatically appear here.
            </p>
          </div>
        ) : (
          queue.map((assessment) => {
            const processing =
              getProcessingState(
                assessment,
              )

            return (
              <div
                key={assessment.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {assessment.name}
                      </h2>

                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-500">
                        {assessment.id}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {assessment.contributorName} · {assessment.task}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${riskClass(
                          assessment.overallRisk,
                        )}`}
                      >
                        {assessment.overallRisk} risk
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${processingClass(
                          processing.status,
                        )}`}
                      >
                        <ProcessingIcon
                          status={
                            processing.status
                          }
                        />

                        {processingLabel(
                          processing.status,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="w-full xl:w-72">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">
                        {processing.currentStep}
                      </span>

                      <span className="font-bold text-slate-700">
                        {processing.progress}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{
                          width: `${processing.progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <Link
                    to={`/analyst/assessments/${assessment.id}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {processing.status ===
                      'analysis_complete' ||
                    processing.status ===
                      'analyst_review'
                      ? 'Review Assessment'
                      : 'View Assessment'}

                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
