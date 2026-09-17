import assessmentsData from '../data/assessments.json'
import assetsData from '../data/assets.json'

import type { Assessment } from '../models/assessment.model'
import type { Asset } from '../models/asset.model'

const ASSESSMENTS_STORAGE_KEY = 'assure_assessments'
const ASSETS_STORAGE_KEY = 'assure_assets'

function getStoredAssessments(): Assessment[] {
  const stored = localStorage.getItem(
    ASSESSMENTS_STORAGE_KEY,
  )

  if (!stored) return []

  try {
    return JSON.parse(stored) as Assessment[]
  } catch {
    return []
  }
}

function getStoredAssets(): Asset[] {
  const stored = localStorage.getItem(
    ASSETS_STORAGE_KEY,
  )

  if (!stored) return []

  try {
    return JSON.parse(stored) as Asset[]
  } catch {
    return []
  }
}

function getDemoAssessments(): Assessment[] {
  const demo = assessmentsData as Assessment[]

  return demo.map((assessment) => {
    if (assessment.processing) {
      return assessment
    }

    let processing: Assessment['processing']

    if (assessment.status === 'completed') {
      processing = {
        status: 'completed',
        progress: 100,
        currentStep: 'Assessment completed',
        startedAt: assessment.createdAt,
        completedAt: assessment.createdAt,
      }
    } else if (assessment.status === 'review') {
      processing = {
        status: 'analyst_review',
        progress: 100,
        currentStep: 'Automated analysis complete — awaiting analyst review',
        startedAt: assessment.createdAt,
      }
    } else if (assessment.status === 'analysis') {
      processing = {
        status: 'processing',
        progress: 68,
        currentStep: 'Running automated assurance checks',
        startedAt: assessment.createdAt,
      }
    } else if (assessment.status === 'registered') {
      processing = {
        status: 'queued',
        progress: 20,
        currentStep: 'Waiting for assurance processing',
        startedAt: assessment.createdAt,
      }
    } else {
      processing = {
        status: 'submitted',
        progress: 0,
        currentStep: 'Submission received',
      }
    }

    return {
      ...assessment,
      processing,
    }
  })
}

function getAllAssessments(): Assessment[] {
  const demoAssessments =
    getDemoAssessments()

  const storedAssessments =
    getStoredAssessments()

  const combined = [
    ...demoAssessments,
    ...storedAssessments,
  ]

  const unique =
    new Map<string, Assessment>()

  combined.forEach((assessment) => {
    unique.set(
      assessment.id,
      assessment,
    )
  })

  return Array.from(unique.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  )
}

function getAllAssets(): Asset[] {
  const demoAssets =
    assetsData as Asset[]

  const storedAssets =
    getStoredAssets()

  const combined = [
    ...demoAssets,
    ...storedAssets,
  ]

  const unique =
    new Map<string, Asset>()

  combined.forEach((asset) => {
    unique.set(
      asset.id,
      asset,
    )
  })

  return Array.from(unique.values()).sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() -
      new Date(a.uploadedAt).getTime(),
  )
}

function saveAssessments(
  assessments: Assessment[],
) {
  localStorage.setItem(
    ASSESSMENTS_STORAGE_KEY,
    JSON.stringify(assessments),
  )
}

function saveAssets(
  assets: Asset[],
) {
  localStorage.setItem(
    ASSETS_STORAGE_KEY,
    JSON.stringify(assets),
  )
}

export function getAssessments(): Assessment[] {
  return getAllAssessments()
}

export function getAssessmentById(
  assessmentId: string,
): Assessment | undefined {
  return getAllAssessments().find(
    (assessment) =>
      assessment.id === assessmentId,
  )
}

export function getAssetsForAssessment(
  assessmentId: string,
): Asset[] {
  return getAllAssets().filter(
    (asset) =>
      asset.assessmentId === assessmentId,
  )
}

export interface CreateAssessmentInput {
  name: string
  contributorId: string
  contributorName: string
  useCase: string
  task: string
}

export function createAssessment(
  input: CreateAssessmentInput,
): Assessment {
  const existing =
    getAllAssessments()

  const stored =
    getStoredAssessments()

  const numericIds =
    existing.map((assessment) => {
      const match =
        assessment.id.match(/^ASM-(\d+)$/)

      return match
        ? Number(match[1])
        : 0
    })

  const nextNumber =
    Math.max(
      0,
      ...numericIds,
    ) + 1

  const now =
    new Date().toISOString()

  const assessment: Assessment = {
    id: `ASM-${String(
      nextNumber,
    ).padStart(3, '0')}`,

    name:
      input.name,

    contributorId:
      input.contributorId,

    contributorName:
      input.contributorName,

    useCase:
      input.useCase,

    task:
      input.task,

    status:
      'submitted',

    overallRisk:
      'low',

    confidence:
      0,

    createdAt:
      now,

    processing: {
      status:
        'submitted',

      progress:
        0,

      currentStep:
        'Submission received',
    },
  }

  saveAssessments([
    ...stored,
    assessment,
  ])

  return assessment
}

export interface RegisterAssetInput {
  assessmentId: string
  type: Asset['type']
  name: string
  format: string
  size: string
}

export function registerAsset(
  input: RegisterAssetInput,
): Asset {
  const existing =
    getAllAssets()

  const stored =
    getStoredAssets()

  const asset: Asset = {
    id: `${input.type.toUpperCase()}-${Date.now()}-${existing.length}`,

    assessmentId:
      input.assessmentId,

    type:
      input.type,

    name:
      input.name,

    format:
      input.format,

    size:
      input.size,

    sha256:
      'pending-backend-validation',

    status:
      'submitted',

    uploadedAt:
      new Date().toISOString(),
  }

  saveAssets([
    ...stored,
    asset,
  ])

  return asset
}
