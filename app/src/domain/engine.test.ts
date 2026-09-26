import { describe, expect, it } from "vitest";
import { ConditionEngine, MAX_EVENTS, MAX_SAMPLES } from "./engine";
import { fixtureSample } from "./fixtures";
import { FLAGS } from "./protocol";

describe("condition/event engine", () => {
  it("waits for three high readings spanning at least 1.5 seconds", () => {
    const engine = new ConditionEngine(8);
    const high = fixtureSample("temperatureExcursion");
    engine.ingest(high, 1000, "demo");
    engine.ingest(high, 1750, "demo");
    expect(engine.ingest(high, 2499, "demo").events).toHaveLength(0);
    expect(engine.ingest(high, 2500, "demo").events).toMatchObject([
      { status: "active", startedAt: 1000, source: "demo" },
    ]);
  });

  it("creates one sustained temperature event, updates its peak, then closes after recovery", () => {
    const engine = new ConditionEngine(8);
    const high = fixtureSample("temperatureExcursion");
    engine.ingest(high, 1000, "demo");
    engine.ingest({ ...high, temperature: 9.8 }, 2000, "demo");
    let result = engine.ingest({ ...high, temperature: 9.8 }, 3000, "demo");
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({ status: "active", peak: 9.8, source: "demo", severity: "warning" });

    for (let i = 0; i < 20; i++) result = engine.ingest({ ...high, temperature: 9.2 }, 4000 + i * 1000, "demo");
    expect(result.events).toHaveLength(1);
    expect(result.events[0].peak).toBe(9.8);

    const normal = fixtureSample("normal");
    engine.ingest(normal, 25000, "demo");
    result = engine.ingest(normal, 26000, "demo");
    expect(result.events[0].status).toBe("recovered");
    expect(result.events[0].endedAt).toBe(26000);
  });

  it("marks an open event interrupted when monitoring stops", () => {
    const engine = new ConditionEngine(8);
    const high = fixtureSample("temperatureExcursion");
    for (let at = 1000; at <= 3000; at += 1000) engine.ingest(high, at, "demo");
    expect(engine.events[0].status).toBe("active");
    engine.interruptActiveEvents(4000);
    expect(engine.events[0]).toMatchObject({ status: "interrupted", endedAt: 4000 });

    engine.ingest(high, 5000, "demo");
    engine.ingest(high, 6000, "demo");
    expect(engine.events).toHaveLength(1);
    engine.ingest(high, 7000, "demo");
    expect(engine.events).toHaveLength(2);
  });

  it("does not trust DHT-fault or ENS warm-up values for event detection", () => {
    const engine = new ConditionEngine(8);
    const high = fixtureSample("temperatureExcursion");
    const faulted = { ...high, flags: high.flags | FLAGS.DHT_FAULT };
    for (let i = 0; i < 6; i++) engine.ingest(faulted, i * 1000, "demo");
    const warming = fixtureSample("ensWarmup");
    const highTvoc = { ...warming, tvoc: 1800, aqi: 5 };
    for (let i = 0; i < 6; i++) engine.ingest(highTvoc, 7000 + i * 1000, "demo");
    expect(engine.events).toHaveLength(0);
  });

  it("records a repeated ENS160 air/VOC change once and marks its recovery", () => {
    const engine = new ConditionEngine(8);
    const high = fixtureSample("airVocExcursion");
    for (let i = 0; i < 8; i++) engine.ingest(high, i * 1000, "ble");
    expect(engine.events).toHaveLength(1);
    expect(engine.events[0]).toMatchObject({ kind: "air-voc", status: "active", source: "ble", severity: "watch" });
    const normal = fixtureSample("normal");
    engine.ingest(normal, 9000, "ble");
    expect(engine.ingest(normal, 10000, "ble").events[0].status).toBe("recovered");
  });

  it("records AQI-only air events with AQI trigger basis and non-misleading peaks", () => {
    const engine = new ConditionEngine(8);
    const aqiOnly = { ...fixtureSample("airVocExcursion"), tvoc: 510, aqi: 4 };
    for (let i = 0; i < 4; i++) engine.ingest(aqiOnly, i * 1000, "ble", "edge-aqi-session");

    expect(engine.events[0]).toMatchObject({
      metric: "air",
      airTriggerBasis: "aqi",
      peakTvoc: 510,
      peakAqi: 4,
      threshold: 4,
      sourceSessionId: "edge-aqi-session",
    });
  });

  it("does not carry an unfinished condition across source sessions", () => {
    const engine = new ConditionEngine(8);
    const high = fixtureSample("temperatureExcursion");
    engine.ingest(high, 1000, "demo", "first-session");
    engine.ingest(high, 2000, "demo", "first-session");
    engine.ingest(high, 3000, "ble", "second-session");
    engine.ingest(high, 4000, "ble", "second-session");
    engine.ingest(high, 5000, "ble", "second-session");

    expect(engine.events).toMatchObject([
      { startedAt: 3000, source: "ble", sourceSessionId: "second-session", status: "active" },
    ]);
  });

  it("bounds sample and event history", () => {
    const engine = new ConditionEngine(8);
    const normal = fixtureSample("normal");
    for (let i = 0; i < MAX_SAMPLES + 10; i++) engine.ingest(normal, i * 1000, "demo");
    expect(engine.samples).toHaveLength(MAX_SAMPLES);
    expect(MAX_EVENTS).toBe(100);
  });
});
