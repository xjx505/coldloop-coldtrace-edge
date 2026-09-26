export interface ReferenceModelArtifact {
  feature_names: string[];
  imputer_medians: Record<string, number>;
  missing_indicator_features: string[];
  scaler_mean: number[];
  scaler_scale: number[];
  coefficients: number[];
  intercept: number;
}

export function score(
  features: Record<string, number | null>,
  model: ReferenceModelArtifact,
): number;
