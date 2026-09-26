import { afterEach, describe, expect, it, vi } from "vitest";
import { EDGE3_CADENCE_MS, type Edge3AggregateRow } from "./aggregation";
import { loadEdge3History, loadForecastEvents, saveEdge3History, saveForecastEvents } from "./coldTracePersistence";
import { PRODUCTION_MODEL_ID } from "./productionModel";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, String(value)); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
  };
}

function readyRows(): Edge3AggregateRow[] {
  return Array.from({ length: 7 }, (_, index) => ({
    timestampMs: 1_700_000_000_000 + index * EDGE3_CADENCE_MS,
    probes: { Front_Middle: 2.2, Middle_Middle: 2.4, Rear_Middle: 2.6 },
    sampleCount: 3,
    validProbeCount: 3,
    sensorErrorCount: 0,
    gap: false,
  }));
}

describe("ColdTrace local persistence", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("restores only a matching source and a continuous seven-row production window", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    const rows = readyRows();
    saveEdge3History({ sourceIdentity: "edge3-device-a", modelVersion: PRODUCTION_MODEL_ID,
      lastValidTimestamp: rows[6].timestampMs, rows });

    expect(loadEdge3History("edge3-device-a", rows[6].timestampMs + 60_000)?.rows).toHaveLength(7);
    expect(loadEdge3History("edge3-device-b", rows[6].timestampMs + 60_000)).toBeNull();
    expect(loadEdge3History("edge3-device-a", rows[6].timestampMs - 120_000)).toBeNull();
  });

  it("rejects a discontinuous window instead of restoring a compressed history", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    const rows = readyRows();
    rows[4] = { ...rows[4], timestampMs: rows[4].timestampMs + 1 };
    saveEdge3History({ sourceIdentity: "edge3-device-a", modelVersion: PRODUCTION_MODEL_ID,
      lastValidTimestamp: rows[6].timestampMs, rows });
    expect(loadEdge3History("edge3-device-a", rows[6].timestampMs + 60_000)).toBeNull();
  });

  it("marks an unfinished model event interrupted after app restart", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    const event = {
      id: "forecast-edge3-1-100-1",
      sourceSessionId: "edge3-1",
      modelVersion: PRODUCTION_MODEL_ID,
      modelRole: "production" as const,
      startedAt: 100,
      endedAt: null,
      status: "active" as const,
      peakRawScore: 0.92,
      threshold: 0.5,
    };
    saveForecastEvents([event]);
    expect(loadForecastEvents(500)).toEqual([{ ...event, status: "interrupted", endedAt: 500 }]);
  });
});
