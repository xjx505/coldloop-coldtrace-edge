import { describe, expect, it } from "vitest";
import { decodeEdge3Telemetry, encodeEdge3Telemetry, type Edge3SensorId } from "../domain/edge3Protocol";
import { EDGE3_CADENCE_MS, Edge3BucketAggregator, validateEdge3Window } from "./aggregation";

function packet(sequence: number, sensorId: Edge3SensorId, temperatureC: number, uptimeMs: number) {
  return decodeEdge3Telemetry(encodeEdge3Telemetry({ sequence, sensorId, temperatureC, uptimeMs }));
}

describe("EDGE-3 aggregation and temporal gates", () => {
  it("aligns buckets to 10-minute boundaries and averages valid readings per probe", () => {
    const aggregator = new Edge3BucketAggregator();
    expect(aggregator.ingest(packet(1, 1, 2, 0), EDGE3_CADENCE_MS).completed).toHaveLength(0);
    aggregator.ingest(packet(2, 1, 4, 1), EDGE3_CADENCE_MS + 1);
    aggregator.ingest(packet(3, 2, 6, 2), EDGE3_CADENCE_MS + 2);
    const result = aggregator.ingest(packet(4, 3, 8, 3), 2 * EDGE3_CADENCE_MS);
    expect(result.completed[0]).toMatchObject({
      timestampMs: EDGE3_CADENCE_MS,
      probes: { Front_Middle: 3, Middle_Middle: 6, Rear_Middle: null },
      validProbeCount: 2,
      sampleCount: 3,
      gap: false,
    });
  });

  it("preserves a missing 10-minute row instead of compressing a time gap", () => {
    const aggregator = new Edge3BucketAggregator();
    aggregator.ingest(packet(1, 1, 1, 0), 0);
    aggregator.ingest(packet(2, 1, 2, EDGE3_CADENCE_MS), EDGE3_CADENCE_MS);
    const result = aggregator.ingest(packet(3, 1, 3, 3 * EDGE3_CADENCE_MS), 3 * EDGE3_CADENCE_MS);
    expect(aggregator.rows.map((row) => row.timestampMs)).toEqual([0, EDGE3_CADENCE_MS, 2 * EDGE3_CADENCE_MS]);
    expect(result.completed).toHaveLength(2);
    expect(result.completed[1]).toMatchObject({ gap: true, validProbeCount: 0, probes: { Middle_Middle: null } });
    expect(validateEdge3Window(result.rows)).toBe("building-history");
  });

  it("rejects duplicate, reordered and non-monotonic packets before they enter a bucket", () => {
    const aggregator = new Edge3BucketAggregator();
    expect(aggregator.ingest(packet(10, 1, 4, 100), 100).accepted).toBe(true);
    expect(aggregator.ingest(packet(10, 2, 5, 100), 100)).toMatchObject({ accepted: false, rejection: "duplicate" });
    expect(aggregator.ingest(packet(9, 2, 5, 101), 101)).toMatchObject({ accepted: false, rejection: "reordered" });
    expect(aggregator.ingest(packet(11, 2, 5, 99), 99)).toMatchObject({ accepted: false, rejection: "late" });
  });

  it("requires seven exact rows and EDGE-3 spatial coverage", () => {
    const aggregator = new Edge3BucketAggregator();
    let sequence = 0;
    for (let row = 0; row < 8; row += 1) {
      const timestamp = row * EDGE3_CADENCE_MS;
      aggregator.ingest(packet(++sequence, 1, 2, timestamp), timestamp);
      aggregator.ingest(packet(++sequence, 3, 3, timestamp), timestamp);
    }
    aggregator.finishReplay();
    expect(aggregator.rows).toHaveLength(7);
    expect(validateEdge3Window(aggregator.rows)).toBe("ready");
  });

  it("pauses when fewer than two positions exist in four rows or the latest row", () => {
    const aggregator = new Edge3BucketAggregator();
    let sequence = 0;
    for (let row = 0; row < 7; row += 1) {
      const timestamp = row * EDGE3_CADENCE_MS;
      aggregator.ingest(packet(++sequence, 1, 2, timestamp), timestamp);
      if (row < 3) aggregator.ingest(packet(++sequence, 3, 3, timestamp), timestamp);
    }
    aggregator.finishReplay();
    expect(validateEdge3Window(aggregator.rows)).toBe("coverage-insufficient");
  });
});
