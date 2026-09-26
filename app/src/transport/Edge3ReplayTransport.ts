import { EDGE3_CADENCE_MS } from "../ai/aggregation";
import { encodeEdge3Telemetry, type Edge3SensorId, type Edge3SensorPosition } from "../domain/edge3Protocol";
import type { ConnectionStatus, TelemetryTransport, TransportHandlers } from "./TelemetryTransport";

export interface Edge3ReplayStep {
  timestamp_iso: string;
  sensors: Record<Edge3SensorPosition, number | null>;
  observed_R2: boolean;
}

export interface Edge3ReplayTrace {
  provenance: string;
  shipment_id: string;
  source: string;
  source_cadence_minutes: number;
  accelerated_seconds_per_step: number;
  source_location: string;
  steps: Edge3ReplayStep[];
}

const SENSOR_IDS: Record<Edge3SensorPosition, Edge3SensorId> = {
  Front_Middle: 1,
  Middle_Middle: 2,
  Rear_Middle: 3,
};

export class Edge3ReplayTransport implements TelemetryTransport {
  readonly kind = "replay" as const;
  private handlers?: TransportHandlers;
  private connected = false;
  private completed = false;
  private stepIndex = 0;
  private sequence = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly trace: Edge3ReplayTrace,
    private readonly delayMs = 1000,
    startingSequence = 0,
  ) {
    this.sequence = startingSequence & 0xffff;
    if (trace.source_cadence_minutes !== 10) throw new Error("EDGE-3 replay trace cadence must be 10 minutes.");
    if (trace.steps.length === 0) throw new Error("EDGE-3 replay trace has no observations.");
  }

  setHandlers(handlers: TransportHandlers): void {
    this.handlers = handlers;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    this.connected = true;
    this.notifyStatus("connecting");
    this.notifyStatus("connected");
    this.emitStep();
  }

  async disconnect(): Promise<void> {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    const wasConnected = this.connected;
    this.connected = false;
    if (wasConnected) this.notifyStatus("disconnected");
  }

  get isComplete(): boolean {
    return this.completed;
  }

  private emitStep(): void {
    if (!this.connected || this.completed) return;
    const step = this.trace.steps[this.stepIndex];
    if (!step) return;
    const offsetMs = this.stepIndex * EDGE3_CADENCE_MS;
    for (const position of ["Front_Middle", "Middle_Middle", "Rear_Middle"] as const) {
      const temperatureC = step.sensors[position];
      if (temperatureC === null) continue;
      this.sequence = (this.sequence + 1) & 0xffff;
      this.handlers?.onPacket(encodeEdge3Telemetry({
        sequence: this.sequence,
        uptimeMs: offsetMs,
        sensorId: SENSOR_IDS[position],
        temperatureC,
        replay: true,
        recordedR2Marker: step.observed_R2,
      }));
    }
    this.stepIndex += 1;
    if (this.stepIndex >= this.trace.steps.length) {
      this.completed = true;
      this.timer = undefined;
      this.handlers?.onComplete?.();
      return;
    }
    this.timer = setTimeout(() => this.emitStep(), Math.max(0, this.delayMs));
  }

  private notifyStatus(status: ConnectionStatus): void {
    this.handlers?.onStatus(status);
  }
}
