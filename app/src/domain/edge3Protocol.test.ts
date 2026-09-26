import { describe, expect, it } from "vitest";
import {
  decodeEdge3Telemetry,
  EDGE3_FLAGS,
  EDGE3_PACKET_BYTES,
  Edge3SequenceGuard,
  encodeEdge3Telemetry,
} from "./edge3Protocol";

describe("EDGE-3 15-byte telemetry profile", () => {
  it("decodes the exact little-endian fields and sentinel values", () => {
    const packet = encodeEdge3Telemetry({
      sequence: 0x1234,
      uptimeMs: 0x01020304,
      sensorId: 2,
      temperatureC: -3.25,
      humidityPercent: null,
      batteryMv: 3710,
      replay: true,
      recordedR2Marker: true,
      doorStateAvailable: true,
      doorOpen: true,
    });
    expect(packet).toHaveLength(15);
    expect(decodeEdge3Telemetry(packet)).toMatchObject({
      sequence: 0x1234,
      uptimeMs: 0x01020304,
      sensorId: 2,
      sensorPosition: "Middle_Middle",
      rawTemperatureC: -3.25,
      temperatureC: -3.25,
      humidityPercent: null,
      batteryMv: 3710,
      replay: true,
      recordedR2Marker: true,
      doorStateAvailable: true,
      doorOpen: true,
    });
  });

  it("rejects wrong lengths, protocol versions, reserved flags and unknown sensor IDs", () => {
    expect(() => decodeEdge3Telemetry(new Uint8Array(14))).toThrow(/15 bytes/);
    const version = encodeEdge3Telemetry({ sequence: 0, uptimeMs: 0, sensorId: 1, temperatureC: 4 });
    version[0] = 2;
    expect(() => decodeEdge3Telemetry(version)).toThrow(/version/);
    const flags = encodeEdge3Telemetry({ sequence: 0, uptimeMs: 0, sensorId: 1, temperatureC: 4 });
    flags[1] = 0x20;
    expect(() => decodeEdge3Telemetry(flags)).toThrow(/reserved/);
    const sensor = encodeEdge3Telemetry({ sequence: 0, uptimeMs: 0, sensorId: 1, temperatureC: 4 });
    sensor[8] = 4;
    expect(() => decodeEdge3Telemetry(sensor)).toThrow(/sensor ID/);
  });

  it("keeps a valid high range reading, rejects the specified out-of-range values and honors device error", () => {
    const high = encodeEdge3Telemetry({ sequence: 1, uptimeMs: 0, sensorId: 1, temperatureC: 100 });
    expect(decodeEdge3Telemetry(high)).toMatchObject({ temperatureC: 100, temperatureError: false });
    const maximum = encodeEdge3Telemetry({ sequence: 2, uptimeMs: 0, sensorId: 1, temperatureC: 125 });
    expect(decodeEdge3Telemetry(maximum)).toMatchObject({ temperatureC: 125, temperatureError: false });
    const over = encodeEdge3Telemetry({ sequence: 3, uptimeMs: 0, sensorId: 1, temperatureC: 125.01 });
    expect(decodeEdge3Telemetry(over)).toMatchObject({ temperatureC: null, temperatureError: true });
    const flagged = encodeEdge3Telemetry({ sequence: 4, uptimeMs: 0, sensorId: 1, temperatureC: 5, sensorError: true });
    expect(decodeEdge3Telemetry(flagged)).toMatchObject({ temperatureC: null, temperatureError: true });
  });

  it("decodes error and no-door-state semantics independently", () => {
    const bytes = encodeEdge3Telemetry({ sequence: 5, uptimeMs: 99, sensorId: 3, temperatureC: null });
    const value = decodeEdge3Telemetry(bytes);
    expect(value.flags & EDGE3_FLAGS.SENSOR_ERROR).not.toBe(0);
    expect(value.doorOpen).toBeNull();
    expect(EDGE3_PACKET_BYTES).toBe(15);
  });

  it("accepts forward sequence numbers, duplicates and out-of-order frames including wraparound", () => {
    const guard = new Edge3SequenceGuard();
    expect(guard.accept(0xfffe)).toBe("accepted");
    expect(guard.accept(0xffff)).toBe("accepted");
    expect(guard.accept(0)).toBe("accepted");
    expect(guard.accept(0)).toBe("duplicate");
    expect(guard.accept(0xffff)).toBe("reordered");
    expect(guard.lastAccepted).toBe(0);
    guard.reset();
    expect(guard.accept(9)).toBe("accepted");
  });
});
