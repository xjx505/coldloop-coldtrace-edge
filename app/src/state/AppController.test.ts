import { afterEach, describe, expect, it, vi } from "vitest";
import { AppController } from "./AppController";

describe("AppController demo integration", () => {
  afterEach(() => vi.useRealTimers());

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
});
