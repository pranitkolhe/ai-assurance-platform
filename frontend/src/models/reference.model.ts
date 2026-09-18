export type ReferenceType = "dataset" | "model" | "inference";

export type ReferenceStatus = "active" | "pending" | "archived";

export interface Reference {
  id: string;
  name: string;
  type: ReferenceType;
  status: ReferenceStatus;

  task: string;
  format: string;

  description: string;

  compatibility: {
    framework?: string;
    architecture?: string;
    inputDimensions?: string;
    classSchema?: string;
    sensor?: string;
    environment?: string;
    season?: string;
    terrain?: string;
    illumination?: string;
  };

  source: string;
  registeredBy: string;
  registeredAt: string;

  metadata: Record<string, string | number | boolean | undefined>;
}
