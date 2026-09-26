import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodeEdge3Telemetry } from "../domain/edge3Protocol";
import { Edge3ReplayTransport, type Edge3ReplayTrace } from "./Edge3ReplayTransport";

const trace: Edge3ReplayTrace = {
  provenance: "recorded strawberry trace",
  shipment_id: "S3",
  source: "local fixture",
  source_cadence_minutes: 10,
  accelerated_seconds_per_step: 1,
  source_location: "Original shipments were outside Qatar",
  steps: [
    { timestamp_iso: "2019-01-01T00:00:00Z", sensors: { Front_Middle: 1, Middle_Middle: 2, Rear_Middle: 3 }, observed_R2: false },
    { timestamp_iso: "2019-01-01T00:10:00Z", sensors: { Front_Middle: 1, Middle_Middle: 2, Rear_Middle: 3 }, observed_R2: true },
  ],
};

describe("EDGE-3 deterministic replay transport", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("emits encoded 15-byte EDGE-3 packets with global sequence and outcome marker kept in flags", async () => {
    const transport = new Edge3ReplayTransport(trace, 50, 0xfffd);
    const packets: Uint8Array[] = [];
    const complete = vi.fn();
    transport.setHandlers({
      onStatus: vi.fn(),
      onPacket: (packet) => packets.push(packet as Uint8Array),
      onError: vi.fn(),
      onComplete: complete,
    });
    await transport.connect();
    expect(packets.map((packet) => decodeEdge3Telemetry(packet)).map((packet) => packet.sequence)).toEqual([0xfffe, 0xffff, 0]);
    expect(packets.every((packet) => packet.byteLength === 15)).toBe(true);
    await vi.advanceTimersByTimeAsync(50);
    expect(packets.map((packet) => decodeEdge3Telemetry(packet)).map((packet) => packet.sequence)).toEqual([0xfffe, 0xffff, 0, 1, 2, 3]);
    expect(decodeEdge3Telemetry(packets[3])).toMatchObject({ uptimeMs: 600_000, sensorId: 1, replay: true, recordedR2Marker: true });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(transport.isComplete).toBe(true);
  });

  it("omits the held-out missing probe instead of fabricating a temperature", async () => {
    const s2: Edge3ReplayTrace = {
      ...trace,
      shipment_id: "S2",
      steps: [{ ...trace.steps[0], sensors: { Front_Middle: 1, Middle_Middle: null, Rear_Middle: 3 } }],
    };
    const transport = new Edge3ReplayTransport(s2, 1);
    const packets: Uint8Array[] = [];
    transport.setHandlers({ onStatus: vi.fn(), onPacket: (packet) => packets.push(packet as Uint8Array), onError: vi.fn() });
    await transport.connect();
    expect(packets).toHaveLength(2);
    expect(packets.map((bytes) => decodeEdge3Telemetry(bytes).sensorId)).toEqual([1, 3]);
  });

  it("preserves a missing 10-minute interval in encoded replay uptime", async () => {
    const gappedTrace: Edge3ReplayTrace = {
      ...trace,
      steps: [trace.steps[0], { ...trace.steps[1], timestamp_iso: "2019-01-01T00:20:00Z" }],
    };
    const transport = new Edge3ReplayTransport(gappedTrace, 1);
    const packets: Uint8Array[] = [];
    transport.setHandlers({ onStatus: vi.fn(), onPacket: (packet) => packets.push(packet as Uint8Array), onError: vi.fn() });
    await transport.connect();
    await vi.advanceTimersByTimeAsync(1);

    expect(decodeEdge3Telemetry(packets[3]).uptimeMs).toBe(1_200_000);
  });

  it("rejects reordered and off-cadence replay chronology instead of normalizing it", () => {
    const reordered = { ...trace, steps: [...trace.steps].reverse() };
    const offCadence = {
      ...trace,
      steps: [trace.steps[0], { ...trace.steps[1], timestamp_iso: "2019-01-01T00:15:00Z" }],
    };
    expect(() => new Edge3ReplayTransport(reordered)).toThrow(/chronological/);
    expect(() => new Edge3ReplayTransport(offCadence)).toThrow(/multiples/);
  });
});
