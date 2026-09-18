import type { ProcessingState } from "../models/processing.model";

const STORAGE_KEY = "assure_processing_states";

function readStates(): Record<string, ProcessingState> {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, ProcessingState>;
    }

    return {};
  } catch {
    return {};
  }
}

function writeStates(states: Record<string, ProcessingState>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

export function getProcessingState(
  assessmentId: string,
): ProcessingState | undefined {
  return readStates()[assessmentId];
}

export function saveProcessingState(
  assessmentId: string,
  state: ProcessingState,
): ProcessingState {
  const states = readStates();

  states[assessmentId] = state;

  writeStates(states);

  window.dispatchEvent(new CustomEvent("assurance:assessment-updated"));

  return state;
}

/**
 * This is the ONLY operation that starts
 * the assurance processing pipeline.
 *
 * It is called after the analyst has:
 *
 * 1. Clicked START ANALYSIS
 * 2. Selected references or explicitly
 *    chosen to continue without references
 * 3. Confirmed START ANALYSIS
 */
export function startProcessing(assessmentId: string): ProcessingState {
  const initialState: ProcessingState = {
    status: "registering",
    progress: 5,
    currentStep: "Registering submitted assets",
    startedAt: new Date().toISOString(),
  };

  return saveProcessingState(assessmentId, initialState);
}

/**
 * Internal automatic pipeline advancement.
 *
 * There is deliberately NO UI button for this.
 * The Assessment Details page automatically
 * invokes this while processing is active.
 */
export function advanceProcessing(
  assessmentId: string,
): ProcessingState | undefined {
  const current = getProcessingState(assessmentId);

  if (!current) {
    return undefined;
  }

  let next: ProcessingState;

  switch (current.status) {
    case "registering":
      next = {
        ...current,
        status: "queued",
        progress: 15,
        currentStep: "Queued for assurance analysis",
      };
      break;

    case "queued":
      next = {
        ...current,
        status: "processing",
        progress: 25,
        currentStep: "Running assurance checks",
      };
      break;

    case "processing": {
      if (current.progress < 90) {
        const nextProgress = Math.min(current.progress + 15, 90);

        let currentStep = "Running assurance analysis";

        if (nextProgress >= 75) {
          currentStep =
            "Correlating evidence and evaluating distribution shift";
        } else if (nextProgress >= 55) {
          currentStep = "Analyzing model and inference integrity";
        } else if (nextProgress >= 35) {
          currentStep = "Analyzing dataset integrity";
        }

        next = {
          ...current,
          progress: nextProgress,
          currentStep,
        };
      } else {
        next = {
          ...current,
          status: "analysis_complete",
          progress: 100,
          currentStep: "Assurance analysis complete",
          completedAt: new Date().toISOString(),
        };
      }

      break;
    }

    case "analysis_complete":
      next = {
        ...current,
        status: "completed",
        progress: 100,
        currentStep: "Analysis results available",
      };
      break;

    case "completed":
      return current;

    case "failed":
      return current;

    case "submitted":
    case "reference_assignment":
    default:
      return current;
  }

  return saveProcessingState(assessmentId, next);
}
