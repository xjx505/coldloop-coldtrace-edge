import { describe, expect, it } from "vitest";
import vectors from "./testdata/all_six_parity_vectors.json";
import { PRODUCTION_MODEL, scoreProductionWindow } from "./productionModel";
import type { Edge3FeatureRow } from "./types";

const tolerance = 1e-10;

describe("bundled ColdTrace production model parity", () => {
  it("uses the all-six EDGE-3 artifact and its uncalibrated decision threshold", () => {
    expect(PRODUCTION_MODEL).toMatchObject({
      model_version: "coldtrace-edge3-logistic-v1",
      sensor_configuration: "EDGE-3",
      decision_threshold: 0.5,
      calibrated: false,
      training_shipments: ["S1", "S2", "S3", "S4", "S5", "S6"],
    });
  });

  it("matches every bundled production feature vector and score", () => {
    expect(vectors).toHaveLength(24);
    for (const vector of vectors) {
      const output = scoreProductionWindow(vector.raw_window as Edge3FeatureRow[]);
      for (const [name, expected] of Object.entries(vector.expected_features)) {
        const actual = output.features[name];
        if (expected === null) expect(actual).toBeNull();
        else expect(Math.abs((actual ?? Number.NaN) - expected)).toBeLessThanOrEqual(tolerance);
      }
      expect(Math.abs(output.rawScore - vector.expected_score)).toBeLessThanOrEqual(tolerance);
      expect(output.modelAlert).toBe(output.rawScore >= 0.5);
    }
  });
});
