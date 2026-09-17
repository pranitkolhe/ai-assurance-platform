import type { Assessment } from '../models/assessment.model'
import type {
  ProcessingState,
  ProcessingStatus,
} from '../models/processing.model'

const STORAGE_KEY = 'assure_assessments'
const RUN_KEY = 'assure_processing_runs'

function getStoredAssessments(): Assessment[] {
  const stored =
    localStorage.getItem(STORAGE_KEY)

  if (!stored) return []

  try {
    return JSON.parse(stored) as Assessment[]
  } catch {
    return []
  }
}

function saveAssessments(
  assessments: Assessment[],
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(assessments),
  )
}

function getRuns(): Record<string, string> {
  const stored =
    localStorage.getItem(RUN_KEY)

  if (!stored) return {}

  try {
    return JSON.parse(stored) as Record<
      string,
      string
    >
  } catch {
    return {}
  }
}

function saveRuns(
  runs: Record<string, string>,
) {
  localStorage.setItem(
    RUN_KEY,
    JSON.stringify(runs),
  )
}

function createRun(
  assessmentId: string,
): string {
  const runs = getRuns()

  const token =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`

  runs[assessmentId] = token

  saveRuns(runs)

  return token
}

function isCurrentRun(
  assessmentId: string,
  token: string,
): boolean {
  return (
    getRuns()[assessmentId] === token
  )
}

function updateAssessment(
  assessmentId: string,
  processing: ProcessingState,
  status: Assessment['status'],
) {
  const assessments =
    getStoredAssessments()

  const updated =
    assessments.map((assessment) =>
      assessment.id === assessmentId
        ? {
            ...assessment,
            status,
            processing,
          }
        : assessment,
    )

  saveAssessments(updated)

  window.dispatchEvent(
    new CustomEvent(
      'assurance:assessment-updated',
      {
        detail: {
          assessmentId,
        },
      },
    ),
  )
}

function getState(
  status: ProcessingStatus,
  progress: number,
  currentStep: string,
): ProcessingState {
  return {
    status,
    progress,
    currentStep,
    startedAt:
      new Date().toISOString(),
    ...(status === 'analysis_complete' ||
    status === 'analyst_review' ||
    status === 'completed'
      ? {
          completedAt:
            new Date().toISOString(),
        }
      : {}),
  }
}

/**
 * Automatically starts the simulated assurance pipeline.
 */
export function startProcessing(
  assessmentId: string,
) {
  const token =
    createRun(assessmentId)

  const startedAt =
    new Date().toISOString()

  updateAssessment(
    assessmentId,
    {
      status: 'submitted',
      progress: 0,
      currentStep:
        'Submission received',
      startedAt,
    },
    'submitted',
  )

  const steps: Array<{
    delay: number
    status: ProcessingStatus
    progress: number
    step: string
    assessmentStatus: Assessment['status']
  }> = [
    {
      delay: 1000,
      status: 'registering',
      progress: 10,
      step: 'Registering submitted artifacts',
      assessmentStatus: 'registered',
    },
    {
      delay: 2000,
      status: 'queued',
      progress: 20,
      step: 'Waiting for assurance processing',
      assessmentStatus: 'registered',
    },
    {
      delay: 4000,
      status: 'processing',
      progress: 35,
      step: 'Validating dataset integrity',
      assessmentStatus: 'analysis',
    },
    {
      delay: 6000,
      status: 'processing',
      progress: 55,
      step: 'Analyzing model integrity',
      assessmentStatus: 'analysis',
    },
    {
      delay: 8000,
      status: 'processing',
      progress: 72,
      step: 'Verifying inference provenance',
      assessmentStatus: 'analysis',
    },
    {
      delay: 10000,
      status: 'processing',
      progress: 88,
      step: 'Analyzing distribution shift',
      assessmentStatus: 'analysis',
    },
    {
      delay: 12000,
      status: 'analysis_complete',
      progress: 100,
      step:
        'Automated baseline analysis complete',
      assessmentStatus: 'review',
    },
  ]

  steps.forEach((item) => {
    window.setTimeout(() => {
      if (
        !isCurrentRun(
          assessmentId,
          token,
        )
      ) {
        return
      }

      updateAssessment(
        assessmentId,
        {
          status: item.status,
          progress: item.progress,
          currentStep: item.step,
          startedAt,
          ...(item.status ===
          'analysis_complete'
            ? {
                completedAt:
                  new Date().toISOString(),
              }
            : {}),
        },
        item.assessmentStatus,
      )
    }, item.delay)
  })
}

/**
 * Manual status control for the SIH demonstration.
 *
 * This cancels the currently running simulated pipeline
 * and forces the assessment into the selected state.
 */
export function setProcessingStatus(
  assessmentId: string,
  status: ProcessingStatus,
) {
  // New token invalidates all old timers.
  createRun(assessmentId)

  const states: Record<
    ProcessingStatus,
    {
      progress: number
      step: string
      assessmentStatus: Assessment['status']
    }
  > = {
    submitted: {
      progress: 0,
      step: 'Submission received',
      assessmentStatus: 'submitted',
    },

    registering: {
      progress: 10,
      step: 'Registering submitted artifacts',
      assessmentStatus: 'registered',
    },

    queued: {
      progress: 20,
      step: 'Waiting for assurance processing',
      assessmentStatus: 'registered',
    },

    processing: {
      progress: 60,
      step: 'Running automated assurance checks',
      assessmentStatus: 'analysis',
    },

    analysis_complete: {
      progress: 100,
      step:
        'Automated baseline analysis complete',
      assessmentStatus: 'review',
    },

    analyst_review: {
      progress: 100,
      step:
        'Awaiting analyst investigation and decision',
      assessmentStatus: 'review',
    },

    completed: {
      progress: 100,
      step: 'Assessment completed',
      assessmentStatus: 'completed',
    },

    failed: {
      progress: 100,
      step: 'Assurance processing failed',
      assessmentStatus: 'analysis',
    },
  }

  const selected =
    states[status]

  updateAssessment(
    assessmentId,
    getState(
      status,
      selected.progress,
      selected.step,
    ),
    selected.assessmentStatus,
  )
}

export function getProcessingState(
  assessment: Assessment,
): ProcessingState {
  if (assessment.processing) {
    return assessment.processing
  }

  if (
    assessment.status ===
    'completed'
  ) {
    return {
      status: 'completed',
      progress: 100,
      currentStep:
        'Assessment completed',
    }
  }

  if (
    assessment.status ===
    'review'
  ) {
    return {
      status: 'analyst_review',
      progress: 100,
      currentStep:
        'Awaiting analyst investigation and decision',
    }
  }

  if (
    assessment.status ===
    'analysis'
  ) {
    return {
      status: 'processing',
      progress: 60,
      currentStep:
        'Running automated assurance checks',
    }
  }

  if (
    assessment.status ===
    'registered'
  ) {
    return {
      status: 'queued',
      progress: 20,
      currentStep:
        'Waiting for assurance processing',
    }
  }

  return {
    status: 'submitted',
    progress: 0,
    currentStep:
      'Submission received',
  }
}
