export type SourceProfileId = "coldloop-20byte" | "edge3-15byte";
export type SourceMode = "physical" | "condition-simulation" | "production-replay" | "evaluation-replay";

export interface SourceCapabilities {
  conditionMonitoring: boolean;
  airQualityMonitoring: boolean;
  thermalForecast: boolean;
  probePositions: number;
}

export interface SourceSession {
  id: string;
  profile: SourceProfileId;
  mode: SourceMode;
  label: string;
  isSimulated: boolean;
  evaluationOnly: boolean;
  capabilities: SourceCapabilities;
}

export function createSourceSession(id: string, profile: SourceProfileId, mode: SourceMode): SourceSession {
  const isEdge3 = profile === "edge3-15byte";
  const isSimulated = mode !== "physical";
  let label: string;
  if (mode === "condition-simulation") label = "ColdLoop simulation";
  else if (mode === "production-replay") label = "ColdTrace Edge · S3 replay";
  else if (mode === "evaluation-replay") label = "ColdTrace Edge · S2 held-out replay";
  else label = isEdge3 ? "ColdTrace Edge · EDGE-3" : "ColdLoop BLE node";

  return {
    id,
    profile,
    mode,
    label,
    isSimulated,
    evaluationOnly: mode === "evaluation-replay",
    capabilities: {
      conditionMonitoring: !isEdge3,
      airQualityMonitoring: !isEdge3,
      thermalForecast: isEdge3,
      probePositions: isEdge3 ? 3 : 1,
    },
  };
}
