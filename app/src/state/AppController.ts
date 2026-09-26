import { ConditionEngine, type ColdChainEvent, type EngineSnapshot, type EventSource, type ObservedSample } from "../domain/engine";
import { decodeTelemetry } from "../domain/protocol";
import { DEMO_SCENARIOS, isConnectionFailureScenario, MockTransport, type DemoScenario } from "../transport/MockTransport";
import { BleTransport, Edge3BleTransport } from "../transport/BleTransport";
import { normalizeTransportError, TransportError, type ConnectionStatus, type TelemetryTransport, type TransportErrorCode, type TransportKind } from "../transport/TelemetryTransport";
import { DEFAULT_THRESHOLD_C, loadEvents, loadSettings, saveEvents, saveSettings } from "./persistence";
import { createSourceSession, type SourceMode, type SourceProfileId, type SourceSession } from "../domain/source";
import { Edge3Pipeline, monotonicEpochNow, type Edge3PipelineSnapshot } from "../ai/Edge3Pipeline";
import type { ForecastEvent } from "../ai/prediction";
import { createProductionReplay } from "../ai/ProductionReplay";
import { clearColdTracePersistence, loadEdge3History, loadForecastEvents, saveEdge3History, saveForecastEvents } from "../ai/coldTracePersistence";
import { PRODUCTION_MODEL_ID } from "../ai/productionModel";

export type MainScreen = "live" | "history" | "device" | "settings";
export type Overlay = { type: "metric"; metric: "temperature" | "humidity" | "air" } | { type: "event"; eventId: string } | { type: "forecast-event"; eventId: string } | null;

export interface Notice {
  code: TransportErrorCode | "disconnected";
  title: string;
  detail: string;
}

export interface AppState {
  screen: MainScreen;
  previousScreen: MainScreen;
  overlay: Overlay;
  connection: ConnectionStatus;
  transportKind: TransportKind | "none";
  sourceSession: SourceSession | null;
  scenario: DemoScenario | null;
  sample: ObservedSample | null;
  samples: ObservedSample[];
  events: ColdChainEvent[];
  edge3: Edge3PipelineSnapshot | null;
  forecastEvents: ForecastEvent[];
  replayComplete: boolean;
  thresholdC: number;
  lastUpdateAt: number | null;
  isStale: boolean;
  notice: Notice | null;
  appActive: boolean;
}

const ERROR_COPY: Record<TransportErrorCode, Pick<Notice, "title" | "detail">> = {
  "bluetooth-off": { title: "Bluetooth is off", detail: "Turn it on to look for a nearby sensor node." },
  "permission-denied": { title: "Nearby devices permission needed", detail: "Allow Bluetooth access in app settings, then try again." },
  "no-device": { title: "No compatible node found", detail: "Check power, BLE advertising and range, then scan again." },
  cancelled: { title: "Scan cancelled", detail: "No device was selected. Connect when you are ready." },
  timeout: { title: "Connection timed out", detail: "Keep the node nearby and powered, then try again." },
  unsupported: { title: "Bluetooth is unavailable here", detail: "Use the offline replay to explore the forecast flow." },
  "connect-failed": { title: "Could not connect", detail: "Check that the sensor node is advertising, then reconnect." },
  "malformed-packet": { title: "Telemetry packet rejected", detail: "The received data did not match the active sensor format. Waiting for the next update." },
};

function noticeCopy(code: TransportErrorCode, profile: SourceProfileId | null): Pick<Notice, "title" | "detail"> {
  if (code === "no-device" && profile === "coldloop-20byte") {
    return { title: "No ColdLoop node found", detail: "Check power, BLE advertising and range, then scan again." };
  }
  if (code === "no-device" && profile === "edge3-15byte") {
    return { title: "No EDGE-3 node found", detail: "Check power, EDGE-3 BLE advertising and range, then scan again." };
  }
  return ERROR_COPY[code];
}

function initialState(): AppState {
  const settings = loadSettings();
  const engine = new ConditionEngine(settings.thresholdC, loadEvents());
  const events = engine.events;
  const forecastEvents = loadForecastEvents();
  saveEvents(events);
  saveForecastEvents(forecastEvents);
  return {
    screen: "live",
    previousScreen: "live",
    overlay: null,
    connection: "disconnected",
    transportKind: "none",
    sourceSession: null,
    scenario: null,
    sample: null,
    samples: [],
    events,
    edge3: null,
    forecastEvents,
    replayComplete: false,
    thresholdC: settings.thresholdC || DEFAULT_THRESHOLD_C,
    lastUpdateAt: null,
    isStale: false,
    notice: null,
    appActive: true,
  };
}

export class AppController {
  private state = initialState();
  private engine = new ConditionEngine(this.state.thresholdC, this.state.events);
  private listeners = new Set<() => void>();
  private transport?: TelemetryTransport;
  private edge3Pipeline?: Edge3Pipeline;
  private edge3SourceIdentity: string | null = null;
  private generation = 0;
  private staleTimer?: number;
  private manualDisconnect = false;
  private sessionSequence = 0;
  private dialogTrigger: HTMLElement | null = null;

  readonly getSnapshot = (): AppState => this.state;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  start(showcase = false): void {
    if (this.staleTimer !== undefined) return;
    this.staleTimer = window.setInterval(() => this.refreshStaleness(), 1000);
    if (showcase) void this.startDemo("normal");
  }

  async dispose(): Promise<void> {
    if (this.staleTimer !== undefined) window.clearInterval(this.staleTimer);
    this.staleTimer = undefined;
    this.generation += 1;
    const current = this.transport;
    this.transport = undefined;
    await current?.disconnect().catch(() => undefined);
  }

  navigate(screen: MainScreen): void {
    if (screen === "settings") this.patch({ previousScreen: this.state.screen, screen, overlay: null });
    else this.patch({ screen, overlay: null });
  }

  openMetric(metric: "temperature" | "humidity" | "air", trigger?: HTMLElement): void {
    this.dialogTrigger = trigger ?? null;
    this.patch({ overlay: { type: "metric", metric } });
  }

  openEvent(eventId: string, trigger?: HTMLElement): void {
    this.dialogTrigger = trigger ?? null;
    this.patch({ overlay: { type: "event", eventId } });
  }

  openForecastEvent(eventId: string, trigger?: HTMLElement): void {
    this.dialogTrigger = trigger ?? null;
    this.patch({ overlay: { type: "forecast-event", eventId } });
  }

  getDialogTrigger(): HTMLElement | null {
    return this.dialogTrigger;
  }

  back(): boolean {
    if (this.state.overlay) {
      this.patch({ overlay: null });
      return true;
    }
    if (this.state.screen === "settings") {
      this.patch({ screen: this.state.previousScreen });
      return true;
    }
    if (this.state.screen !== "live") {
      this.patch({ screen: "live" });
      return true;
    }
    return false;
  }

  setThreshold(value: number): void {
    const thresholdC = Math.max(2, Math.min(12, Math.round(value * 2) / 2));
    this.engine.setThreshold(thresholdC);
    saveSettings({ thresholdC });
    this.patch({ thresholdC });
  }

  setAppActive(appActive: boolean): void {
    this.patch({ appActive });
    if (appActive) this.refreshStaleness();
  }

  clearHistory(): void {
    this.engine.clearEvents();
    this.edge3Pipeline?.clearForecastEvents();
    saveEvents([]);
    clearColdTracePersistence();
    this.patch({ events: [], forecastEvents: [], edge3: this.edge3Pipeline?.snapshot ?? this.state.edge3 });
  }

  async connectBle(): Promise<void> {
    await this.replaceTransport(new BleTransport(), "ble", null, "coldloop-20byte", "physical");
    if (!this.transport) return;
    try {
      await this.transport.connect();
    } catch (error) {
      this.handleConnectError(error);
    }
  }

  async connectEdge3Ble(): Promise<void> {
    const transport = new Edge3BleTransport();
    const sourceSessionId = this.nextSourceSessionId("edge3-ble");
    await this.replaceTransport(transport, "edge3-ble", null, "edge3-15byte", "physical", sourceSessionId, new Edge3Pipeline(sourceSessionId));
    if (!this.transport) return;
    try {
      await this.transport.connect();
    } catch (error) {
      this.handleConnectError(error);
    }
  }

  async requestBluetoothOn(): Promise<void> {
    const ble = this.transport instanceof BleTransport
      ? this.transport
      : this.state.sourceSession?.profile === "edge3-15byte" ? new Edge3BleTransport() : new BleTransport();
    try {
      await ble.requestEnable();
      this.patch({ notice: null, connection: "disconnected" });
    } catch (error) {
      this.setNotice(normalizeTransportError(error));
    }
  }

  async openPermissionSettings(): Promise<void> {
    const ble = this.transport instanceof BleTransport
      ? this.transport
      : this.state.sourceSession?.profile === "edge3-15byte" ? new Edge3BleTransport() : new BleTransport();
    try { await ble.openAppSettings(); } catch { /* Settings navigation is best effort on web. */ }
  }

  async startDemo(scenario: DemoScenario = "normal"): Promise<void> {
    if (this.transport instanceof MockTransport && this.state.connection === "connected" && !isConnectionFailureScenario(scenario)) {
      this.patch({ scenario, notice: null });
      this.transport.setScenario(scenario);
      return;
    }
    const mock = new MockTransport();
    mock.setScenario(scenario);
    await this.replaceTransport(mock, "demo", scenario, "coldloop-20byte", "condition-simulation");
    if (!this.transport) return;
    try {
      await this.transport.connect();
    } catch (error) {
      this.handleConnectError(error);
    }
  }

  async startProductionReplay(delayMs = 650): Promise<void> {
    const sourceSessionId = this.nextSourceSessionId("replay");
    const { pipeline, transport } = createProductionReplay(sourceSessionId, delayMs);
    await this.replaceTransport(transport, "replay", null, "edge3-15byte", "production-replay", sourceSessionId, pipeline);
    if (!this.transport) return;
    try { await this.transport.connect(); } catch (error) { this.handleConnectError(error); }
  }

  async startS2EvaluationReplay(delayMs = 650): Promise<void> {
    // The held-out model and trace are loaded only after an explicit evaluation action.
    const evaluation = await import("../ai/evaluation/S2Replay");
    const sourceSessionId = this.nextSourceSessionId("replay");
    const { pipeline, transport } = evaluation.createS2EvaluationReplay(sourceSessionId, delayMs);
    await this.replaceTransport(transport, "replay", null, "edge3-15byte", "evaluation-replay", sourceSessionId, pipeline);
    if (!this.transport) return;
    try { await this.transport.connect(); } catch (error) { this.handleConnectError(error); }
  }

  async stopDemo(): Promise<void> {
    if (!(this.transport instanceof MockTransport)) return;
    const current = this.transport;
    this.generation += 1;
    this.transport = undefined;
    await current.disconnect().catch(() => undefined);
    this.engine.interruptActiveEvents(Date.now());
    this.engine.clearSamples();
    const events = this.engine.events;
    saveEvents(events);
    this.patch({
      connection: "disconnected",
      transportKind: "none",
      sourceSession: null,
      scenario: null,
      sample: null,
      samples: [],
      lastUpdateAt: null,
      isStale: false,
      notice: null,
      events,
    });
  }

  async stopReplay(): Promise<void> {
    if (this.state.sourceSession?.mode !== "production-replay" && this.state.sourceSession?.mode !== "evaluation-replay") return;
    const current = this.transport;
    this.generation += 1;
    this.transport = undefined;
    await current?.disconnect().catch(() => undefined);
    this.edge3Pipeline?.interrupt(this.edge3InterruptTime());
    this.persistForecastEvents(this.edge3Pipeline?.snapshot.forecast.events ?? []);
    this.patch({
      connection: "disconnected",
      replayComplete: false,
      edge3: this.edge3Pipeline?.snapshot ?? this.state.edge3,
      forecastEvents: this.state.forecastEvents,
      notice: null,
    });
  }

  async disconnect(): Promise<void> {
    if (this.transport instanceof MockTransport) {
      await this.stopDemo();
      return;
    }
    if (this.state.sourceSession?.mode === "production-replay" || this.state.sourceSession?.mode === "evaluation-replay") {
      await this.stopReplay();
      return;
    }
    const current = this.transport;
    if (!current) {
      this.patch({ connection: "disconnected", transportKind: "none", sourceSession: null, scenario: null });
      return;
    }
    this.manualDisconnect = true;
    await current.disconnect().catch(() => undefined);
    this.manualDisconnect = false;
    this.interruptCurrentEvents();
    this.patch({ connection: "disconnected", isStale: this.hasCurrentTelemetry(), notice: null,
      events: this.engine.events, edge3: this.edge3Pipeline?.snapshot ?? this.state.edge3, forecastEvents: this.state.forecastEvents });
  }

  private nextSourceSessionId(kind: TransportKind): string {
    this.sessionSequence += 1;
    return `${kind}-${Date.now()}-${this.sessionSequence}`;
  }

  private async replaceTransport(
    transport: TelemetryTransport,
    kind: TransportKind,
    scenario: DemoScenario | null,
    sourceProfile: SourceProfileId,
    sourceMode: SourceMode,
    requestedSessionId?: string,
    edge3Pipeline: Edge3Pipeline | null = null,
  ): Promise<void> {
    const previous = this.transport;
    this.generation += 1;
    const generation = this.generation;
    const sourceSessionId = requestedSessionId ?? this.nextSourceSessionId(kind);
    const sourceSession = createSourceSession(sourceSessionId, sourceProfile, sourceMode);
    this.interruptCurrentEvents();
    this.transport = transport;
    this.edge3Pipeline = edge3Pipeline ?? undefined;
    this.edge3SourceIdentity = null;
    this.engine.clearSamples();
    this.patch({
      connection: "scanning",
      transportKind: kind,
      sourceSession,
      scenario,
      notice: null,
      sample: null,
      samples: [],
      edge3: edge3Pipeline?.snapshot ?? null,
      replayComplete: false,
      lastUpdateAt: null,
      isStale: false,
      events: this.engine.events,
      forecastEvents: this.state.forecastEvents,
    });
    await previous?.disconnect().catch(() => undefined);
    transport.setHandlers({
      onStatus: (connection) => {
        if (generation !== this.generation) return;
        if (this.manualDisconnect && connection === "disconnected") return;
        if (connection === "disconnected") this.interruptCurrentEvents();
        this.patch({ connection, notice: connection === "connected" ? null : this.state.notice,
          events: this.engine.events, edge3: this.edge3Pipeline?.snapshot ?? this.state.edge3,
          forecastEvents: this.state.forecastEvents });
      },
      onPacket: (packet) => {
        if (generation !== this.generation) return;
        if (sourceProfile === "edge3-15byte") this.handleEdge3Packet(packet, sourceSessionId);
        else this.handlePacket(packet, kind === "demo" ? "demo" : "ble", sourceSessionId);
      },
      onSourceIdentity: (identity) => {
        if (generation !== this.generation || sourceProfile !== "edge3-15byte" || sourceMode !== "physical") return;
        this.edge3SourceIdentity = identity;
        const history = loadEdge3History(identity);
        if (history && this.edge3Pipeline?.restoreHistory(history.rows, sourceSessionId)) {
          const edge3 = this.edge3Pipeline.snapshot;
          this.patch({ edge3, lastUpdateAt: edge3.lastPacketAt, isStale: false });
        }
      },
      onComplete: () => {
        if (generation !== this.generation || !this.edge3Pipeline) return;
        this.edge3Pipeline.finishReplay();
        // A trace ending above threshold is incomplete evidence of recovery.
        this.edge3Pipeline.interrupt(this.edge3InterruptTime());
        this.persistForecastEvents(this.edge3Pipeline.snapshot.forecast.events);
        this.patch({ connection: "disconnected", replayComplete: true,
          edge3: this.edge3Pipeline.snapshot, forecastEvents: this.state.forecastEvents });
      },
      onError: (error) => {
        if (generation !== this.generation) return;
        this.setNotice(error);
      },
    });
  }

  private handlePacket(packet: DataView | ArrayBuffer | Uint8Array, source: EventSource, sourceSessionId: string): void {
    let sample;
    try { sample = decodeTelemetry(packet); }
    catch {
      this.setNotice(new TransportError("malformed-packet", "Packet does not match the ColdLoop 20-byte contract."));
      return;
    }
    const snapshot: EngineSnapshot = this.engine.ingest(sample, Date.now(), source, sourceSessionId);
    saveEvents(snapshot.events);
    this.patch({ sample: snapshot.sample, samples: snapshot.samples, events: snapshot.events,
      lastUpdateAt: snapshot.sample.receivedAt, isStale: false,
      notice: this.state.notice?.code === "malformed-packet" ? null : this.state.notice });
  }

  private handleEdge3Packet(packet: DataView | ArrayBuffer | Uint8Array, sourceSessionId: string): void {
    const pipeline = this.edge3Pipeline;
    if (!pipeline) return;
    const result = pipeline.ingest(packet);
    const snapshot = result.snapshot;
    if (result.malformed) {
      this.setNotice(new TransportError("malformed-packet", "Packet does not match the EDGE-3 15-byte v1 contract."));
      this.patch({ edge3: snapshot });
      return;
    }
    if (!result.accepted) {
      this.patch({ edge3: snapshot, notice: this.state.notice });
      return;
    }
    const newId = snapshot.sourceSessionId;
    const sourceSession = this.state.sourceSession && newId !== sourceSessionId
      ? { ...this.state.sourceSession, id: newId }
      : this.state.sourceSession;
    if (this.edge3SourceIdentity && this.state.sourceSession?.mode === "physical"
      && snapshot.forecast.rows.length === 7) {
      saveEdge3History({ sourceIdentity: this.edge3SourceIdentity, modelVersion: PRODUCTION_MODEL_ID,
        lastValidTimestamp: snapshot.forecast.rows[6].timestampMs, rows: snapshot.forecast.rows });
    }
    this.persistForecastEvents(snapshot.forecast.events);
    this.patch({ edge3: snapshot, sourceSession, lastUpdateAt: snapshot.lastPacketAt,
      isStale: false, notice: this.state.notice?.code === "malformed-packet" ? null : this.state.notice,
      forecastEvents: this.state.forecastEvents });
  }

  private interruptCurrentEvents(): void {
    if (this.state.sourceSession?.profile === "edge3-15byte") {
      this.edge3Pipeline?.interrupt(this.edge3InterruptTime());
      this.persistForecastEvents(this.edge3Pipeline?.snapshot.forecast.events ?? []);
    } else {
      this.engine.interruptActiveEvents(Date.now());
      saveEvents(this.engine.events);
    }
  }

  private edge3InterruptTime(): number {
    const mode = this.state.sourceSession?.mode;
    if (mode === "production-replay" || mode === "evaluation-replay") {
      return this.edge3Pipeline?.snapshot.lastPacketAt ?? monotonicEpochNow();
    }
    return monotonicEpochNow();
  }

  private persistForecastEvents(incoming: readonly ForecastEvent[]): void {
    if (incoming.length === 0) return;
    const merged = new Map(this.state.forecastEvents.map((event) => [event.id, event]));
    incoming.forEach((event) => merged.set(event.id, event));
    const forecastEvents = [...merged.values()].sort((a, b) => b.startedAt - a.startedAt).slice(0, 100);
    saveForecastEvents(forecastEvents);
    if (this.state.forecastEvents !== forecastEvents) this.patch({ forecastEvents });
  }

  private refreshStaleness(): void {
    const timestamp = this.state.sourceSession?.profile === "edge3-15byte"
      ? this.state.edge3?.lastPacketAt
      : this.state.lastUpdateAt;
    const isStale = timestamp !== null && timestamp !== undefined && (
      this.state.connection !== "connected" || monotonicEpochNow() - timestamp > 6_500
    ) && this.state.sourceSession?.mode !== "production-replay" && this.state.sourceSession?.mode !== "evaluation-replay";
    if (isStale !== this.state.isStale) this.patch({ isStale });
  }

  private hasCurrentTelemetry(): boolean {
    return this.state.sourceSession?.profile === "edge3-15byte"
      ? this.state.edge3?.lastPacketAt !== null && this.state.edge3?.lastPacketAt !== undefined
      : this.state.sample !== null;
  }

  private handleConnectError(error: unknown): void {
    const mapped = normalizeTransportError(error);
    const connection = mapped.code === "cancelled" ? "disconnected" : "error";
    this.patch({ connection, notice: { code: mapped.code, ...noticeCopy(mapped.code, this.state.sourceSession?.profile ?? null) } });
  }

  private setNotice(error: TransportError): void {
    const copy = noticeCopy(error.code, this.state.sourceSession?.profile ?? null);
    if (error.code === "connect-failed" && error.message === "The sensor link was lost.") {
      this.patch({ connection: "disconnected", notice: { code: "disconnected", title: "Sensor link lost", detail: "Move the node back in range, then reconnect." } });
      return;
    }
    this.patch({ notice: { code: error.code, ...copy } });
  }

  private patch(update: Partial<AppState>): void {
    this.state = { ...this.state, ...update };
    this.listeners.forEach((listener) => listener());
  }
}

export { DEMO_SCENARIOS };
