export interface InferenceRecord {
  id: string;
  assessmentId: string;
  imageId: string;
  imageHash: string;
  modelId: string;
  modelHash: string;
  preprocessingHash: string;
  timestamp: string;
  sequence: number;
  nonce: string;
  signatureValid: boolean;
  replayDetected: boolean;
  outputTampered: boolean;
}
