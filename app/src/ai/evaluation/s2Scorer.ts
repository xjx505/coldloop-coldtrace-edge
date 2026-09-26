import evaluationModelAsset from "./edge_model_s2_loso.json";
import { extractFeatures } from "../reference/features.js";
import { score } from "../reference/model.js";
import { EDGE3_FEATURE_SCHEMA } from "../productionModel";
import type { Edge3FeatureRow } from "../types";
import type { ModelScore } from "../productionModel";

export const EVALUATION_MODEL_ID = "coldtrace-edge3-logistic-s2-loso-v1";
export const EVALUATION_MODEL_ROLE = "S2-held-out judge replay only; do not use as the general deployment artifact";
const EVALUATION_MODEL = evaluationModelAsset;

export function scoreS2HeldoutWindow(window: readonly Edge3FeatureRow[]): ModelScore {
  if (EVALUATION_MODEL.model_version !== EVALUATION_MODEL_ID
    || EVALUATION_MODEL.model_role !== EVALUATION_MODEL_ROLE
    || EVALUATION_MODEL.heldout_shipment !== "S2") {
    throw new Error("S2 evaluation model role metadata does not match the held-out replay contract.");
  }
  if (EVALUATION_MODEL.sensor_configuration !== "EDGE-3") {
    throw new Error("S2 evaluation model is not configured for EDGE-3.");
  }
  const features = extractFeatures(window, "EDGE-3", EDGE3_FEATURE_SCHEMA);
  const rawScore = score(features, EVALUATION_MODEL);
  return {
    modelVersion: EVALUATION_MODEL_ID,
    rawScore,
    threshold: EVALUATION_MODEL.decision_threshold,
    modelAlert: rawScore >= EVALUATION_MODEL.decision_threshold,
    features,
  };
}
