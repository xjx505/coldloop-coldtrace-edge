import type { Edge3FeatureRow, FeatureSchema } from "../types";

export function extractFeatures(
  window: readonly Edge3FeatureRow[],
  configuration: "EDGE-3",
  schema: FeatureSchema,
): Record<string, number | null>;
