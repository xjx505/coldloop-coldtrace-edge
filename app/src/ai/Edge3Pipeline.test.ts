import { describe, expect, it } from "vitest";
import { encodeEdge3Telemetry } from "../domain/edge3Protocol";
import { EDGE3_CADENCE_MS } from "./aggregation";
import { Edge3Pipeline } from "./Edge3Pipeline";

function emitRow(pipeline: Edge3Pipeline, index: number, sequenceStart: number, recordedR2Marker: boolean): number {
  let sequence = sequenceStart;
  const uptimeMs = index * EDGE3_CADENCE_MS;
  for (const [sensorId, temperatureC] of [[1, 2 + index * 0.05], [2, 2.2 + index * 0.05], [3, 2.4 + index * 0.05]] as const) {
    pipeline.ingest(encodeEdge3Telemetry({
      sequence: ++sequence,
      uptimeMs,
      sensorId: sensorId as 1 | 2 | 3,
      temperatureC,
      replay: true,
      recordedR2Marker,
    }), 1_700_000_000_000 + uptimeMs);
  }
  return sequence;
}

describe("EDGE-3 app ingestion boundary", () => {
  it("excludes the recorded outcome marker from features and leaves production score unchanged", () => {
    const marked = new Edge3Pipeline("hardware-replay-a");
    const unmarked = new Edge3Pipeline("hardware-replay-b");
    let markedSequence = 0;
    let unmarkedSequence = 0;
    for (let row = 0; row < 7; row += 1) {
      markedSequence = emitRow(marked, row, markedSequence, true);
      unmarkedSequence = emitRow(unmarked, row, unmarkedSequence, false);
    }
    const resultMarked = marked.finishReplay().forecast;
    const resultUnmarked = unmarked.finishReplay().forecast;
    expect(resultMarked.status).toBe("ready");
    expect(resultUnmarked.status).toBe("ready");
    expect(resultMarked.latest?.rawScore).toBe(resultUnmarked.latest?.rawScore);
    expect(resultMarked.latest?.modelVersion).toBe("coldtrace-edge3-logistic-v1");
    expect(resultMarked.latest?.features).not.toHaveProperty("recorded_R2");
    expect(resultMarked.rows).toHaveLength(7);
  });

  it("rejects duplicate/malformed data and starts a fresh sub-session when firmware replay mode changes", () => {
    const pipeline = new Edge3Pipeline("physical-edge3");
    const valid = encodeEdge3Telemetry({ sequence: 1, uptimeMs: 0, sensorId: 2, temperatureC: 4, replay: true });
    expect(pipeline.ingest(valid, 1_700_000_000_000).accepted).toBe(true);
    expect(pipeline.ingest(valid, 1_700_000_000_000).rejection).toBe("duplicate");
    expect(pipeline.ingest(new Uint8Array(14), 1_700_000_000_100).rejection).toBe("malformed-packet");
    const before = pipeline.snapshot.sourceSessionId;
    const live = encodeEdge3Telemetry({ sequence: 2, uptimeMs: 500, sensorId: 2, temperatureC: 5, replay: false });
    const switched = pipeline.ingest(live, 1_700_000_000_500);
    expect(switched.accepted).toBe(true);
    expect(switched.snapshot.sourceSessionId).not.toBe(before);
    expect(switched.snapshot.forecast.rows).toHaveLength(0);
    expect(switched.snapshot.replayStream).toBe(false);
  });
});
