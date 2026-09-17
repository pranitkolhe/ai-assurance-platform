import {
  validateUploadedAsset,
} from '../services/assetService'

import type {
  UploadAssetType,
} from '../utils/fileValidation'

export function validateAssetUpload(
  file: File,
  type: UploadAssetType,
  format: string,
) {
  return validateUploadedAsset(
    file,
    type,
    format,
  )
}
