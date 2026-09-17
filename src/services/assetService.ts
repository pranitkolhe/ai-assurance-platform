import type { Asset } from '../models/asset.model'
import type { UploadAssetType } from '../utils/fileValidation'
import {
  validateFile,
} from '../utils/fileValidation'

export interface UploadedAsset {
  type: Asset['type']
  file: File
  format: string
  valid: boolean
  error?: string
}

export function validateUploadedAsset(
  file: File,
  type: UploadAssetType,
  format: string,
): UploadedAsset {
  const result =
    validateFile(
      file,
      format,
    )

  return {
    type,
    file,
    format,
    valid: result.valid,
    error: result.message,
  }
}
