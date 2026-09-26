import { describe, expect, it } from "vitest";
import vectors from "./s2_heldout_parity_vectors.json";
import type { Edge3FeatureRow } from "../types";
import { EVALUATION_MODEL_ID, EVALUATION_MODEL_ROLE, scoreS2HeldoutWindow } from "./s2Scorer";
import { Edge3PredictionEngine } from "../prediction";

const tolerance = 1e-10;

describe("S2 held-out evaluation model firewall", () => {
  it("keeps the held-out artifact explicitly tagged for S2 evaluation only", () => {
    expect(EVALUATION_MODEL_ID).toBe("coldtrace-edge3-logistic-s2-loso-v1");
    expect(EVALUATION_MODEL_ROLE).toContain("S2-held-out judge replay only");
  });

  it("matches all 24 S2 feature and score vectors only through its dedicated scorer", () => {
    expect(vectors).toHaveLength(24);
    for (const vector of vectors) {
      const result = scoreS2HeldoutWindow(vector.raw_window as Edge3FeatureRow[]);
      for (const [name, expected] of Object.entries(vector.expected_features)) {
        const actual = result.features[name];
        if (expected === null) expect(actual).toBeNull();
        else expect(Math.abs((actual ?? Number.NaN) - expected)).toBeLessThanOrEqual(tolerance);
      }
      expect(Math.abs(result.rawScore - vector.expected_score)).toBeLessThanOrEqual(tolerance);
    }
  });

  it("marks its events as evaluation-only when explicitly injected into an evaluation engine", () => {
    const engine = new Edge3PredictionEngine(scoreS2HeldoutWindow, "s2-heldout-evaluation");
    const result = scoreS2HeldoutWindow(vectors[0].raw_window as Edge3FeatureRow[]);
    engine.recordScore(result, 1_000, "explicit-s2-eval-session");
    if (result.modelAlert) {
      expect(engine.snapshot.events[0]).toMatchObject({ modelRole: "s2-heldout-evaluation", modelVersion: EVALUATION_MODEL_ID });
    }
  });
});
