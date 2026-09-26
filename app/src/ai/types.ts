import type { Edge3SensorPosition } from "../domain/edge3Protocol";

export type Edge3FeatureRow = Readonly<Record<Edge3SensorPosition, number | null>>;

export interface FeatureSchema {
  schema_version: number;
  window_samples: number;
  window_minutes: number;
  cadence_minutes: number;
  high_reference_c: number;
  low_reference_c: number;
  sensor_configurations: Record<"EDGE-1" | "EDGE-3", Edge3SensorPosition[]>;
  features: Record<"EDGE-1" | "EDGE-3_EXTRA", string[]>;
}

export interface ProductionModelArtifact {
  schema_version: number;
  model_version: string;
  sensor_configuration: "EDGE-3";
  window_minutes: number;
  source_cadence_minutes: number;
  feature_names: string[];
  imputer_medians: Record<string, number>;
  missing_indicator_features: string[];
  scaler_mean: number[];
  scaler_scale: number[];
  coefficients: number[];
  intercept: number;
  decision_threshold: number;
  target: string;
  feature_schema: FeatureSchema;
  training_shipments: string[];
  calibrated: false;
  model_sha256: string;
}
