import { describe, expect, it } from "vitest";
import { PRODUCTION_MODEL_ID, PRODUCTION_THRESHOLD } from "./productionModel";
import { Edge3PredictionEngine } from "./prediction";
import type { ModelScore, ProductionScore } from "./productionModel";
import { EDGE3_CADENCE_MS, type Edge3AggregateRow } from "./aggregation";

function score(rawScore: number): ProductionScore {
  return {
    modelVersion: PRODUCTION_MODEL_ID,
    rawScore,
    threshold: PRODUCTION_THRESHOLD,
    modelAlert: rawScore >= PRODUCTION_THRESHOLD,
    features: {},
  };
}

describe("forecast event grouping", () => {
  it("opens once on the first high score, updates the peak and closes on the next valid low score", () => {
    const engine = new Edge3PredictionEngine();
    engine.resetForSource("replay-s3", 100);
    engine.recordScore(score(0.6), 1_000, "replay-s3");
    engine.recordScore(score(0.8), 2_000, "replay-s3");
    expect(engine.snapshot.events).toHaveLength(1);
    expect(engine.snapshot.events[0]).toMatchObject({
      status: "active",
      sourceSessionId: "replay-s3",
      modelVersion: PRODUCTION_MODEL_ID,
      modelRole: "production",
      startedAt: 1_000,
      peakRawScore: 0.8,
      threshold: 0.5,
    });

    engine.recordScore(score(0.49), 3_000, "replay-s3");
    expect(engine.snapshot.events[0]).toMatchObject({ status: "recovered", endedAt: 3_000 });
    engine.recordScore(score(0.7), 4_000, "replay-s3");
    expect(engine.snapshot.events).toHaveLength(2);
  });

  it("interrupts an active event at a new source boundary and clears the previous score", () => {
    const engine = new Edge3PredictionEngine();
    engine.resetForSource("replay-a", 100);
    engine.recordScore(score(0.6), 1_000, "replay-a");
    engine.resetForSource("replay-b", 2_000);
    expect(engine.snapshot.events[0]).toMatchObject({ status: "interrupted", endedAt: 2_000 });
    expect(engine.snapshot.latest).toBeNull();
    expect(engine.snapshot.rows).toHaveLength(0);
  });

  it("pauses production readiness when the current center probe is missing but preserves S2 evaluation parity", () => {
    const rows: Edge3AggregateRow[] = Array.from({ length: 7 }, (_, index) => ({
      timestampMs: 1_700_000_000_000 + index * EDGE3_CADENCE_MS,
      probes: { Front_Middle: 2, Middle_Middle: null, Rear_Middle: 3 },
      sampleCount: 2,
      validProbeCount: 2,
      sensorErrorCount: 0,
      gap: false,
    }));
    const heldoutScore: ModelScore = {
      modelVersion: "coldtrace-edge3-logistic-s2-loso-v1",
      rawScore: 0.4,
      threshold: 0.5,
      modelAlert: false,
      features: {},
    };
    const production = new Edge3PredictionEngine();
    const evaluation = new Edge3PredictionEngine(() => heldoutScore, "s2-heldout-evaluation");

    expect(production.updateRows(rows, [rows[6]], "production-source")).toMatchObject({ status: "paused", reason: "coverage-insufficient", latest: null });
    expect(evaluation.updateRows(rows, [rows[6]], "s2-evaluation")).toMatchObject({ status: "ready", latest: heldoutScore });
  });
});
