import { encodeTelemetry, FLAGS, type TelemetrySample } from "../domain/protocol";
import { TransportError, type TelemetryTransport, type TransportHandlers } from "./TelemetryTransport";

export const DEMO_SCENARIOS = [
  { id: "normal", label: "Normal conditions" },
  { id: "ens-warming", label: "ENS160 warm-up" },
  { id: "temperature-rising", label: "Temperature rising" },
  { id: "temperature-warning", label: "Temperature excursion" },
  { id: "recovery", label: "Recovery" },
  { id: "air-voc-excursion", label: "Air / VOC change" },
  { id: "dht-fault", label: "DHT22 fault" },
  { id: "ens-fault", label: "ENS160 fault" },
  { id: "bluetooth-off", label: "Bluetooth off" },
  { id: "permission-denied", label: "Permission denied" },
  { id: "no-device", label: "No device found" },
  { id: "connect-timeout", label: "Connection timeout" },
  { id: "connect-failed", label: "Connection failed" },
  { id: "malformed-packet", label: "Malformed packet" },
  { id: "stale", label: "Pause telemetry" },
] as const;

export type DemoScenario = typeof DEMO_SCENARIOS[number]["id"];

const CONNECTION_FAILURES = new Set<DemoScenario>(["bluetooth-off", "permission-denied", "no-device", "connect-timeout", "connect-failed"]);
export const isConnectionFailureScenario = (scenario: DemoScenario): boolean => CONNECTION_FAILURES.has(scenario);

function connectionFailure(scenario: DemoScenario): TransportError | null {
  if (scenario === "bluetooth-off") return new TransportError("bluetooth-off", "Bluetooth is turned off.");
  if (scenario === "permission-denied") return new TransportError("permission-denied", "Nearby devices permission was denied.");
  if (scenario === "no-device") return new TransportError("no-device", "No ColdLoop node found.");
  if (scenario === "connect-timeout") return new TransportError("timeout", "Connection timed out.");
  if (scenario === "connect-failed") return new TransportError("connect-failed", "The GATT connection failed.");
  return null;
}

const BASE_SAMPLE: TelemetrySample = {
  seq: 0,
  temperature: 4.8,
  humidity: 82,
  mq135Raw: 900,
  tvoc: 90,
  eco2: 450,
  aqi: 1,
  ensStatus: 0,
  anomaly: 0,
  flags: FLAGS.MQ_BASELINE_READY,
  uptimeMs: 0,
};

function scenarioSample(scenario: DemoScenario, index: number): TelemetrySample {
  const sample = { ...BASE_SAMPLE, seq: index & 0xffff, uptimeMs: index * 1000 };
  switch (scenario) {
    case "ens-warming":
      sample.ensStatus = 0x04; // ENS160 validity flag 01: warm-up.
      sample.tvoc = 1200;
      sample.aqi = 4;
      return sample;
    case "temperature-rising":
      sample.temperature = index < 5 ? 4.8 + index * 0.9 : 9.1;
      break;
    case "temperature-warning":
      sample.temperature = 9.2;
      break;
    case "recovery":
      sample.temperature = Math.max(4.8, 9.2 - index * 1.15);
      break;
    case "air-voc-excursion":
      sample.mq135Raw = 1600;
      sample.tvoc = 950;
      sample.eco2 = 1100;
      sample.aqi = 4;
      sample.flags |= FLAGS.MQ_RISE;
      break;
    case "dht-fault":
      sample.temperature = 0;
      sample.humidity = 0;
      sample.flags |= FLAGS.DHT_FAULT;
      return sample;
    case "ens-fault":
      sample.ensStatus = 0x40;
      sample.tvoc = 0;
      sample.eco2 = 0;
      sample.aqi = 0;
      sample.flags |= FLAGS.ENS_FAULT;
      return sample;
    case "stale":
    case "normal":
      sample.temperature = 4.8 + ((index % 5) - 2) * 0.1;
      break;
  }
  if (sample.temperature > 8) sample.flags |= FLAGS.TEMP_HIGH;
  if (sample.tvoc >= 700) sample.flags |= FLAGS.TVOC_HIGH;
  sample.anomaly = Math.min(100, (sample.flags & FLAGS.TEMP_HIGH ? 40 : 0) + (sample.flags & FLAGS.TVOC_HIGH ? 30 : 0));
  return sample;
}

const wait = (ms: number) => new Promise<void>((resolve) => globalThis.setTimeout(resolve, ms));

export class MockTransport implements TelemetryTransport {
  readonly kind = "demo" as const;
  private handlers?: TransportHandlers;
  private connected = false;
  private connecting = false;
  private timer?: ReturnType<typeof setInterval>;
  private index = 0;
  private scenario: DemoScenario = "normal";

  constructor(private readonly transitionDelayMs = 180) {}

  setHandlers(handlers: TransportHandlers): void {
    this.handlers = handlers;
  }

  setScenario(scenario: DemoScenario): void {
    this.scenario = scenario;
    this.index = 0;
    if (this.connected) this.beginScenario();
  }

  async connect(): Promise<void> {
    if (this.connected || this.connecting) return;
    this.connecting = true;
    this.handlers?.onStatus("scanning");
    await wait(this.transitionDelayMs);
    const failure = connectionFailure(this.scenario);
    if (failure && (failure.code === "bluetooth-off" || failure.code === "permission-denied")) {
      this.failConnection(failure);
    }
    this.handlers?.onStatus("connecting");
    await wait(this.transitionDelayMs);
    if (failure) this.failConnection(failure);
    this.connected = true;
    this.connecting = false;
    this.handlers?.onStatus("connected");
    this.beginScenario();
  }

  async disconnect(): Promise<void> {
    if (this.timer !== undefined) globalThis.clearInterval(this.timer);
    this.timer = undefined;
    const wasConnected = this.connected || this.connecting;
    this.connected = false;
    this.connecting = false;
    if (wasConnected) this.handlers?.onStatus("disconnected");
  }

  private beginScenario(): void {
    if (this.timer !== undefined) globalThis.clearInterval(this.timer);
    this.timer = undefined;
    this.index = 0;
    this.emitOne();
    if (this.scenario !== "stale" && this.scenario !== "malformed-packet") {
      this.timer = globalThis.setInterval(() => this.emitOne(), 1000);
    }
  }

  private emitOne(): void {
    if (!this.connected) return;
    if (this.scenario === "malformed-packet") {
      this.handlers?.onPacket(new Uint8Array(19));
      return;
    }
    const packet = encodeTelemetry(scenarioSample(this.scenario, this.index++));
    this.handlers?.onPacket(packet);
  }

  private failConnection(error: TransportError): never {
    this.connected = false;
    this.connecting = false;
    this.handlers?.onStatus("error");
    this.handlers?.onError(error);
    throw error;
  }

  static unavailable(): TransportError {
    return new TransportError("unsupported", "The deterministic demo transport could not start.");
  }
}
