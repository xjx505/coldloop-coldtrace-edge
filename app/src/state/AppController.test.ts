import { afterEach, describe, expect, it, vi } from "vitest";
import { AppController } from "./AppController";
import { EDGE3_CADENCE_MS } from "../ai/aggregation";
import { PRODUCTION_MODEL_ID } from "../ai/productionModel";
import { EDGE3_SERVICE_UUID } from "../domain/edge3Protocol";

const ble = vi.hoisted(() => ({
  initialize: vi.fn(),
  isEnabled: vi.fn(),
  requestDevice: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  startNotifications: vi.fn(),
  stopNotifications: vi.fn(),
}));

vi.mock("@capacitor-community/bluetooth-le", () => ({ BleClient: ble }));
vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform: () => "android" } }));

describe("AppController demo integration", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("keeps malformed-packet feedback after changing a connected demo scenario", async () => {
    vi.useFakeTimers();
    const controller = new AppController();
    const connecting = controller.startDemo("normal");
    await vi.advanceTimersByTimeAsync(500);
    await connecting;
    expect(controller.getSnapshot().connection).toBe("connected");

    await controller.startDemo("malformed-packet");

    expect(controller.getSnapshot().notice).toMatchObject({
      code: "malformed-packet",
      title: "Telemetry packet rejected",
    });
    await controller.dispose();
  });

  it("runs the deterministic normal, excursion, recovery and clean-stop path", async () => {
    vi.useFakeTimers();
    const controller = new AppController();
    const connecting = controller.startDemo("normal");
    await vi.advanceTimersByTimeAsync(500);
    await connecting;
    expect(controller.getSnapshot().sample?.temperature).toBe(4.6);
    expect(controller.getSnapshot().events).toHaveLength(0);
    const sessionId = controller.getSnapshot().sourceSession?.id;
    expect(controller.getSnapshot().sourceSession).toMatchObject({
      profile: "coldloop-20byte",
      mode: "condition-simulation",
      isSimulated: true,
      evaluationOnly: false,
      capabilities: { conditionMonitoring: true, thermalForecast: false, probePositions: 1 },
    });

    await controller.startDemo("temperature-rising");
    expect(controller.getSnapshot().sourceSession?.id).toBe(sessionId);
    await vi.advanceTimersByTimeAsync(7_000);
    const active = controller.getSnapshot().events.filter((event) => event.status === "active");
    expect(active).toHaveLength(1);
    expect(active[0].source).toBe("demo");
    expect(controller.getSnapshot().sample?.temperature).toBeGreaterThan(8);

    await controller.startDemo("recovery");
    await vi.advanceTimersByTimeAsync(3_500);
    expect(controller.getSnapshot().events).toHaveLength(1);
    expect(controller.getSnapshot().events[0].status).toBe("recovered");

    await controller.stopDemo();
    expect(controller.getSnapshot()).toMatchObject({
      connection: "disconnected",
      transportKind: "none",
      scenario: null,
      sample: null,
      samples: [],
      isStale: false,
    });
    expect(controller.getSnapshot().events).toHaveLength(1);
    expect(controller.getSnapshot().events[0].status).toBe("recovered");
    await controller.dispose();
  });

  it("runs the S3 trace through the EDGE-3 path and keeps it out of ColdLoop conditions", async () => {
    vi.useFakeTimers();
    const controller = new AppController();
    const starting = controller.startProductionReplay(0);
    await starting;
    await vi.runAllTimersAsync();

    const state = controller.getSnapshot();
    expect(state.sourceSession).toMatchObject({ profile: "edge3-15byte", mode: "production-replay", evaluationOnly: false });
    expect(state.edge3?.forecast.status).toBe("ready");
    expect(state.edge3?.forecast.latest?.modelVersion).toBe("coldtrace-edge3-logistic-v1");
    expect(state.edge3?.forecast.latest?.modelAlert).toBe(false);
    expect(state.edge3?.forecast.latest?.rawScore).toBeCloseTo(0.13010145750491162, 10);
    expect(state.edge3?.forecast.rows).toHaveLength(7);
    expect(state.sample).toBeNull();
    expect(state.events).toHaveLength(0);
    expect(state.forecastEvents).toHaveLength(0);
    expect(state.connection).toBe("disconnected");
    expect(state.replayComplete).toBe(true);
    await controller.dispose();
  });

  it("loads held-out S2 only after explicit action and labels resulting event as evaluation", async () => {
    vi.useFakeTimers();
    const controller = new AppController();
    const starting = controller.startS2EvaluationReplay(0);
    await starting;
    await vi.runAllTimersAsync();

    const state = controller.getSnapshot();
    expect(state.sourceSession).toMatchObject({ profile: "edge3-15byte", mode: "evaluation-replay", evaluationOnly: true });
    expect(state.edge3?.forecast.latest?.modelVersion).toBe("coldtrace-edge3-logistic-s2-loso-v1");
    expect(state.forecastEvents.length).toBeGreaterThan(0);
    expect(state.forecastEvents.every((event) => event.modelRole === "s2-heldout-evaluation")).toBe(true);
    expect(state.forecastEvents[0].status).toBe("interrupted");
    expect(state.forecastEvents[0].endedAt).toBeGreaterThanOrEqual(state.forecastEvents[0].startedAt);
    expect(state.sample).toBeNull();
    await controller.dispose();
  });

  it("restores a fresh persisted window only after connecting the matching physical EDGE-3 source", async () => {
    vi.useFakeTimers();
    const cadence = EDGE3_CADENCE_MS;
    const now = Math.floor(Date.now() / cadence) * cadence + 30_000;
    vi.setSystemTime(now);
    const currentBucket = Math.floor(now / cadence) * cadence;
    const lastCompletedBucket = currentBucket - cadence;
    const rows = Array.from({ length: 7 }, (_, index) => ({
      timestampMs: lastCompletedBucket - (6 - index) * cadence,
      probes: { Front_Middle: 2.2, Middle_Middle: 2.4, Rear_Middle: 2.6 },
      sampleCount: 3,
      validProbeCount: 3,
      sensorErrorCount: 0,
      gap: false,
    }));
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    });
    storage.set("coldloop.coldtrace.history.v1", JSON.stringify({
      sourceIdentity: "edge3-ble:node-01",
      modelVersion: PRODUCTION_MODEL_ID,
      lastValidTimestamp: rows[6].timestampMs,
      rows,
    }));

    ble.initialize.mockResolvedValue(undefined);
    ble.isEnabled.mockResolvedValue(true);
    ble.requestDevice.mockResolvedValue({ deviceId: "node-01", name: "EDGE-3" });
    ble.disconnect.mockResolvedValue(undefined);
    ble.connect.mockResolvedValue(undefined);
    ble.startNotifications.mockResolvedValue(undefined);
    ble.stopNotifications.mockResolvedValue(undefined);

    const controller = new AppController();
    await controller.connectEdge3Ble();

    expect(ble.requestDevice).toHaveBeenCalledWith({ services: [EDGE3_SERVICE_UUID] });
    expect(controller.getSnapshot()).toMatchObject({
      connection: "connected",
      sourceSession: { profile: "edge3-15byte", mode: "physical", isSimulated: false },
      edge3: { forecast: { status: "ready", rows } },
    });
    await controller.disconnect();
    await controller.dispose();
  });
});
