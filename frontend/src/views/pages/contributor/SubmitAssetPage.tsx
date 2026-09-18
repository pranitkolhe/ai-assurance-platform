import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";

import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileArchive,
  FileJson,
  Upload,
  X,
} from "lucide-react";

import {
  DATASET_FORMATS,
  INFERENCE_FORMATS,
  MODEL_FORMATS,
  formatFileSize,
  getAcceptAttribute,
  getAllowedExtensions,
  validateFile,
} from "../../../utils/fileValidation";

import type { UploadAssetType } from "../../../utils/fileValidation";

import {
  createAssessment,
  registerAsset,
} from "../../../services/assessmentService";

import { saveUploadedFile } from "../../../services/fileStorageService";

import { useAuth } from "../../../context/AuthContext";

interface PendingAsset {
  type: UploadAssetType;
  format: string;
  file: File;
}

const TASK_OPTIONS = [
  "Object Detection",
  "Image Classification",
  "Semantic Segmentation",
  "Instance Segmentation",
  "Image Retrieval",
  "Other",
];

const ASSET_OPTIONS: {
  type: UploadAssetType;
  title: string;
  description: string;
}[] = [
  {
    type: "dataset",
    title: "Dataset",
    description:
      "Training or validation data used by the computer-vision model.",
  },
  {
    type: "model",
    title: "Model",
    description: "Trained computer-vision model or model weights.",
  },
  {
    type: "inference",
    title: "Inference Records",
    description:
      "Records containing model inputs, outputs and inference metadata.",
  },
];

export default function SubmitAssetPage() {
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [assessmentName, setAssessmentName] = useState("");

  const [useCase, setUseCase] = useState("");

  const [task, setTask] = useState("");

  const [selectedType, setSelectedType] = useState<UploadAssetType | null>(
    null,
  );

  const [selectedFormat, setSelectedFormat] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);

  const [error, setError] = useState("");

  const [isDragging, setIsDragging] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const [createdAssessmentId, setCreatedAssessmentId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAssessmentInformationComplete =
    assessmentName.trim().length > 0 &&
    useCase.trim().length > 0 &&
    task.length > 0;

  const getFormatsForType = () => {
    if (selectedType === "dataset") {
      return DATASET_FORMATS;
    }

    if (selectedType === "model") {
      return MODEL_FORMATS;
    }

    if (selectedType === "inference") {
      return INFERENCE_FORMATS;
    }

    return [];
  };

  const getAssetIcon = (type: UploadAssetType) => {
    if (type === "dataset") {
      return Database;
    }

    if (type === "model") {
      return FileArchive;
    }

    return FileJson;
  };

  const getFormatDescription = (format: string) => {
    const descriptions: Record<string, string> = {
      COCO: "COCO-style dataset annotations. JSON or packaged ZIP dataset.",

      YOLO: "YOLO dataset package containing images, labels and dataset configuration.",

      ONNX: "Open Neural Network Exchange model.",

      PyTorch: "PyTorch model weights or checkpoint.",

      TorchScript: "TorchScript serialized model.",

      JSON: "JSON-formatted inference records.",

      JSONL: "JSON Lines inference records, one record per line.",

      CSV: "CSV-formatted inference records.",
    };

    return descriptions[format] ?? "";
  };

  const openUploadModal = (type: UploadAssetType) => {
    setSelectedType(type);
    setSelectedFormat("");
    setSelectedFile(null);
    setError("");
    setSubmitted(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeUploadModal = () => {
    setSelectedType(null);
    setSelectedFormat("");
    setSelectedFile(null);
    setError("");
    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormatChange = (format: string) => {
    setSelectedFormat(format);
    setSelectedFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFile = (file: File) => {
    if (!selectedType) {
      return;
    }

    if (!selectedFormat) {
      setError("Please select an asset format first.");

      return;
    }

    const validation = validateFile(file, selectedFormat);

    if (!validation.valid) {
      setSelectedFile(null);

      setError(validation.message ?? "This file cannot be uploaded.");

      return;
    }

    setSelectedFile(file);
    setError("");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      processFile(file);
    }
  };

  const handleAddAsset = () => {
    if (!selectedType) {
      return;
    }

    if (!selectedFormat) {
      setError("Please select an asset format.");

      return;
    }

    if (!selectedFile) {
      setError("Please select a valid file.");

      return;
    }

    const validation = validateFile(selectedFile, selectedFormat);

    if (!validation.valid) {
      setError(validation.message ?? "The selected file is invalid.");

      return;
    }

    const newPendingAsset: PendingAsset = {
      type: selectedType,
      format: selectedFormat,
      file: selectedFile,
    };

    setPendingAssets((current) => [...current, newPendingAsset]);

    closeUploadModal();
  };

  const removePendingAsset = (index: number) => {
    setPendingAssets((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const readiness = useMemo(
    () => ({
      information: isAssessmentInformationComplete,

      assets: pendingAssets.length > 0,
    }),
    [isAssessmentInformationComplete, pendingAssets.length],
  );

  const canSubmit =
    readiness.information && readiness.assets && !isSubmitting && !!user;

  const handleSubmitAssessment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setError("You must be logged in to submit an assessment.");

      return;
    }

    if (!readiness.information) {
      setError("Please complete the assessment information.");

      return;
    }

    if (!readiness.assets) {
      setError("Please add at least one asset before submitting.");

      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      /*
       * 1. Create the assessment.
       */
      const assessment = createAssessment({
        name: assessmentName.trim(),

        contributorId: user.id,

        contributorName: user.name,

        useCase: useCase.trim(),

        task,
      });

      /*
       * 2. Register every asset and persist
       *    the actual uploaded file in IndexedDB.
       */
      for (const pendingAsset of pendingAssets) {
        const registeredAsset = registerAsset(assessment.id, {
          type: pendingAsset.type,
          name: pendingAsset.file.name,
          format: pendingAsset.format,
          size: formatFileSize(pendingAsset.file.size),
          sha256: "pending",
          status: "submitted",
        });

        await saveUploadedFile(
          registeredAsset.id,
          assessment.id,
          pendingAsset.file,
        );
      }

      /*
       * 3. Start the automatic assurance
       *    processing workflow only after
       *    the assets have been registered
       *    and stored.
       */

      setCreatedAssessmentId(assessment.id);

      setSubmitted(true);

      setAssessmentName("");
      setUseCase("");
      setTask("");
      setPendingAssets([]);
    } catch {
      setError(
        "Unable to submit the assessment or store the uploaded asset. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={32} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Assessment Submitted
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Your assessment and uploaded assets have been registered
            successfully. Automated assurance processing has started.
          </p>

          <div className="mx-auto mt-6 max-w-md rounded-xl bg-slate-50 p-4 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Assessment ID
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {createdAssessmentId}
            </p>

            <p className="mt-2 text-xs font-medium text-blue-600">
              Status: Automated processing started
            </p>
          </div>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={`/contributor/assessments/${createdAssessmentId}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View Assessment Status
              <ArrowRight size={16} />
            </a>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setCreatedAssessmentId("");
              }}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          Contributor Workspace
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Submit Assets
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Submit one or more computer-vision artifacts for automated assurance
          analysis. Each uploaded artifact is validated and stored as part of
          the assessment.
        </p>
      </div>

      <form onSubmit={handleSubmitAssessment} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Assessment Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Describe the computer-vision system being submitted.
            </p>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">
                Assessment Name
              </label>

              <input
                value={assessmentName}
                onChange={(event) => setAssessmentName(event.target.value)}
                placeholder="e.g. Vehicle Detection Assurance"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Use Case
              </label>

              <input
                value={useCase}
                onChange={(event) => setUseCase(event.target.value)}
                placeholder="e.g. Autonomous road perception"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Computer Vision Task
              </label>

              <select
                value={task}
                onChange={(event) => setTask(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select task</option>

                {TASK_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900">Assets</h2>

            <p className="mt-1 text-sm text-slate-500">
              Add the artifacts available for this assurance assessment. At
              least one valid artifact is required.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {ASSET_OPTIONS.map((option) => {
              const Icon = getAssetIcon(option.type);

              const count = pendingAssets.filter(
                (asset) => asset.type === option.type,
              ).length;

              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => openUploadModal(option.type)}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition group-hover:text-blue-600">
                      <Icon size={21} />
                    </div>

                    {count > 0 && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {count} added
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-900">
                    {option.title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {option.description}
                  </p>

                  <div className="mt-4 text-xs font-semibold text-blue-600">
                    Add {option.title} →
                  </div>
                </button>
              );
            })}
          </div>

          {pendingAssets.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Selected Assets
              </h3>

              {pendingAssets.map((asset, index) => (
                <div
                  key={`${asset.file.name}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Upload size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {asset.file.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {asset.type} · {asset.format} ·{" "}
                        {formatFileSize(asset.file.size)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePendingAsset(index)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Remove asset"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Ready for submission
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {readiness.information
                ? "Assessment information complete."
                : "Complete the assessment information."}{" "}
              {readiness.assets
                ? `${pendingAssets.length} asset${pendingAssets.length === 1 ? "" : "s"} ready.`
                : "Add at least one asset."}
            </p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Submitting..." : "Submit for Assurance"}

            {!isSubmitting && <ArrowRight size={17} />}
          </button>
        </div>
      </form>

      {selectedType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add{" "}
                  {
                    ASSET_OPTIONS.find((option) => option.type === selectedType)
                      ?.title
                  }
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Select a supported format and upload the artifact.
                </p>
              </div>

              <button
                type="button"
                onClick={closeUploadModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Asset Format
                </label>

                <select
                  value={selectedFormat}
                  onChange={(event) => handleFormatChange(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select format</option>

                  {getFormatsForType().map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>

                {selectedFormat && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {getFormatDescription(selectedFormat)}
                  </p>
                )}
              </div>

              {selectedFormat && (
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <Upload size={22} />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-900">
                    Drop your file here
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    or choose a file from your computer
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={getAcceptAttribute(selectedFormat)}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Choose File
                  </button>

                  <p className="mt-3 text-[11px] text-slate-400">
                    Accepted: {getAllowedExtensions(selectedFormat).join(", ")}
                  </p>
                </div>
              )}

              {selectedFile && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      size={19}
                      className="shrink-0 text-emerald-600"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-emerald-900">
                        {selectedFile.name}
                      </p>

                      <p className="mt-1 text-xs text-emerald-700">
                        {formatFileSize(selectedFile.size)} · Validated
                        successfully
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeUploadModal}
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddAsset}
                disabled={!selectedFormat || !selectedFile}
                className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Add Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
