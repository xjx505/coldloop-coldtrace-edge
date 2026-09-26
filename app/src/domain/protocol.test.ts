import { describe, expect, it } from "vitest";
import { decodeTelemetry, encodeTelemetry, ensReadiness, FLAGS, humidityTrusted, temperatureTrusted } from "./protocol";
import { GOLDEN_FIXTURES } from "./fixtures";

describe("ColdLoop 20-byte telemetry contract", () => {
  it("decodes the normal golden packet with the documented little-endian units", () => {
    const sample = decodeTelemetry(GOLDEN_FIXTURES.normal);
    expect(GOLDEN_FIXTURES.normal).toHaveLength(20);
    expect(sample).toMatchObject({ seq: 1, temperature: 4.8, humidity: 82, mq135Raw: 900, tvoc: 80, eco2: 450, aqi: 1, flags: FLAGS.MQ_BASELINE_READY, uptimeMs: 2000 });
  });

  it("covers warm-up, temperature, air/VOC, combined and both sensor-fault fixtures", () => {
    expect(ensReadiness(decodeTelemetry(GOLDEN_FIXTURES.ensWarmup))).toBe("warming");
    expect(decodeTelemetry(GOLDEN_FIXTURES.temperatureExcursion).temperature).toBe(9.25);
    expect(decodeTelemetry(GOLDEN_FIXTURES.airVocExcursion).tvoc).toBe(950);
    expect(decodeTelemetry(GOLDEN_FIXTURES.combinedWarning).flags & (FLAGS.TEMP_HIGH | FLAGS.MQ_RISE | FLAGS.TVOC_HIGH)).toBe(7);
    const dht = decodeTelemetry(GOLDEN_FIXTURES.dhtFault);
    expect(temperatureTrusted(dht)).toBe(false);
    expect(humidityTrusted(dht)).toBe(false);
    expect(ensReadiness(decodeTelemetry(GOLDEN_FIXTURES.ensFault))).toBe("fault");
  });

  it("rejects short and oversized packets instead of silently accepting them", () => {
    expect(() => decodeTelemetry(new Uint8Array(19))).toThrow(/must be 20 bytes/);
    expect(() => decodeTelemetry(new Uint8Array(21))).toThrow(/must be 20 bytes/);
  });

  it("respects byte offsets for BLE buffers and round-trips the packet layout", () => {
    const wrapped = new Uint8Array(24);
    wrapped.set(GOLDEN_FIXTURES.normal, 2);
    expect(decodeTelemetry(wrapped.subarray(2, 22))).toMatchObject({ seq: 1, temperature: 4.8 });
    const sample = decodeTelemetry(GOLDEN_FIXTURES.combinedWarning);
    expect(decodeTelemetry(encodeTelemetry(sample))).toEqual(sample);
  });
});
