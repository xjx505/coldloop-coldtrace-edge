import featureSchemaAsset from "./reference/feature_schema.json";
import productionModelAsset from "./reference/edge_model.json";
import { extractFeatures } from "./reference/features.js";
import { score } from "./reference/model.js";
import type { Edge3FeatureRow, FeatureSchema, ProductionModelArtifact } from "./types";

export const PRODUCTION_MODEL = productionModelAsset as ProductionModelArtifact;
export const EDGE3_FEATURE_SCHEMA = featureSchemaAsset as FeatureSchema;
export const PRODUCTION_MODEL_ID = "coldtrace-edge3-logistic-v1";
export const PRODUCTION_THRESHOLD = PRODUCTION_MODEL.decision_threshold;

export interface ModelScore {
  modelVersion: string;
  rawScore: number;
  threshold: number;
  modelAlert: boolean;
  features: Record<string, number | null>;
}

export interface ProductionScore extends ModelScore {
  modelVersion: typeof PRODUCTION_MODEL_ID;
}

export function scoreProductionWindow(window: readonly Edge3FeatureRow[]): ProductionScore {
  if (PRODUCTION_MODEL.model_version !== PRODUCTION_MODEL_ID) {
    throw new Error("Bundled production model version does not match the integration contract.");
  }
  if (PRODUCTION_MODEL.sensor_configuration !== "EDGE-3") {
    throw new Error("The production artifact is not configured for EDGE-3.");
  }
  const features = extractFeatures(window, "EDGE-3", EDGE3_FEATURE_SCHEMA);
  const rawScore = score(features, PRODUCTION_MODEL);
  return {
    modelVersion: PRODUCTION_MODEL_ID,
    rawScore,
    threshold: PRODUCTION_THRESHOLD,
    modelAlert: rawScore >= PRODUCTION_THRESHOLD,
    features,
  };
}
