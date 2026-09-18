export type UploadAssetType = "dataset" | "model" | "inference";

export type DatasetFormat = "COCO" | "YOLO";

export type ModelFormat = "ONNX" | "PyTorch" | "TorchScript";

export type InferenceFormat = "JSON" | "JSONL" | "CSV";

export interface FileValidationResult {
  valid: boolean;
  message?: string;
}

export const DATASET_FORMATS: DatasetFormat[] = ["COCO", "YOLO"];

export const MODEL_FORMATS: ModelFormat[] = ["ONNX", "PyTorch", "TorchScript"];

export const INFERENCE_FORMATS: InferenceFormat[] = ["JSON", "JSONL", "CSV"];

const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024;

const FORMAT_EXTENSIONS: Record<string, string[]> = {
  COCO: [".json", ".zip"],
  YOLO: [".zip"],

  ONNX: [".onnx"],

  PyTorch: [".pt", ".pth"],

  TorchScript: [".pt", ".torchscript"],

  JSON: [".json"],
  JSONL: [".jsonl"],
  CSV: [".csv"],
};

function getExtension(fileName: string): string {
  const lowerName = fileName.toLowerCase();

  if (!lowerName.includes(".")) {
    return "";
  }

  return `.${lowerName.split(".").pop()}`;
}

export function getAllowedExtensions(format: string): string[] {
  return FORMAT_EXTENSIONS[format] ?? [];
}

export function getAcceptAttribute(format: string): string {
  return getAllowedExtensions(format).join(",");
}

export function validateFile(file: File, format: string): FileValidationResult {
  const extension = getExtension(file.name);

  const allowedExtensions = FORMAT_EXTENSIONS[format] ?? [];

  if (allowedExtensions.length === 0) {
    return {
      valid: false,
      message: "Unsupported asset format.",
    };
  }

  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      message:
        `Invalid file type for ${format}. ` +
        `Expected: ${allowedExtensions.join(", ")}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: "File exceeds the 20 GB upload limit.",
    };
  }

  return {
    valid: true,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB", "TB"];

  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ` + `${units[index]}`;
}
