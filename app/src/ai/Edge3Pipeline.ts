import {
  EDGE3_SENSOR_POSITIONS,
  decodeEdge3Telemetry,
  type Edge3SensorPosition,
  type Edge3TelemetryPacket,
} from "../domain/edge3Protocol";
import { Edge3BucketAggregator, type Edge3AggregateRow } from "./aggregation";
import { Edge3PredictionEngine, type ForecastState } from "./prediction";

let epochOrigin = Date.now() - (globalThis.performance?.now() ?? 0);

export function monotonicEpochNow(): number {
  if (globalThis.performance && Number.isFinite(globalThis.performance.now())) {
    return epochOrigin + globalThis.performance.now();
  }
  return Date.now();
}

class Edge3TimestampClock {
  private replayEpochOrigin: number | null = null;

  timestamp(packet: Edge3TelemetryPacket, receiptEpochMs: number): number {
    if (!packet.replay) return receiptEpochMs;
    if (this.replayEpochOrigin === null) this.replayEpochOrigin = receiptEpochMs - packet.uptimeMs;
    return this.replayEpochOrigin + packet.uptimeMs;
  }

  reset(): void {
    this.replayEpochOrigin = null;
  }
}

export interface Edge3ProbeState {
  temperatureC: number | null;
  state: "waiting" | "ready" | "sensor-error";
  lastSeenAt: number | null;
  sampleCount: number;
}

export interface Edge3PipelineSnapshot {
  sourceSessionId: string;
  replayStream: boolean | null;
  acceptedPackets: number;
  rejectedPackets: number;
  malformedPackets: number;
  lastPacketAt: number | null;
  probes: Record<Edge3SensorPosition, Edge3ProbeState>;
  forecast: ForecastState;
}

export interface Edge3IngestResult {
  accepted: boolean;
  malformed: boolean;
  rejection: string | null;
  snapshot: Edge3PipelineSnapshot;
}

function emptyProbes(): Record<Edge3SensorPosition, Edge3ProbeState> {
  return {
    Front_Middle: { temperatureC: null, state: "waiting", lastSeenAt: null, sampleCount: 0 },
    Middle_Middle: { temperatureC: null, state: "waiting", lastSeenAt: null, sampleCount: 0 },
    Rear_Middle: { temperatureC: null, state: "waiting", lastSeenAt: null, sampleCount: 0 },
  };
}

export class Edge3Pipeline {
  private sourceSessionId: string;
  private streamMode: boolean | null = null;
  private aggregator = new Edge3BucketAggregator();
  private prediction = new Edge3PredictionEngine();
  private clock = new Edge3TimestampClock();
  private acceptedPackets = 0;
  private rejectedPackets = 0;
  private malformedPackets = 0;
  private lastPacketAt: number | null = null;
  private probes = emptyProbes();
  private modeGeneration = 0;

  constructor(sourceSessionId: string, prediction = new Edge3PredictionEngine()) {
    this.sourceSessionId = sourceSessionId;
    this.prediction = prediction;
    this.prediction.resetForSource(sourceSessionId, monotonicEpochNow());
  }

  get snapshot(): Edge3PipelineSnapshot {
    const forecast = this.prediction.snapshot;
    return {
      sourceSessionId: this.sourceSessionId,
      replayStream: this.streamMode,
      acceptedPackets: this.acceptedPackets,
      rejectedPackets: this.rejectedPackets,
      malformedPackets: this.malformedPackets,
      lastPacketAt: this.lastPacketAt,
      probes: {
        Front_Middle: { ...this.probes.Front_Middle },
        Middle_Middle: { ...this.probes.Middle_Middle },
        Rear_Middle: { ...this.probes.Rear_Middle },
      },
      forecast,
    };
  }

  ingest(input: DataView | ArrayBuffer | Uint8Array, receiptEpochMs = monotonicEpochNow()): Edge3IngestResult {
    let packet: Edge3TelemetryPacket;
    try {
      packet = decodeEdge3Telemetry(input);
    } catch {
      this.malformedPackets += 1;
      this.rejectedPackets += 1;
      return { accepted: false, malformed: true, rejection: "malformed-packet", snapshot: this.snapshot };
    }

    if (this.streamMode !== null && this.streamMode !== packet.replay) {
      this.modeGeneration += 1;
      this.sourceSessionId = this.sourceSessionId.split("-stream-")[0] + "-stream-" + this.modeGeneration;
      this.aggregator.reset();
      this.clock.reset();
      this.probes = emptyProbes();
      this.lastPacketAt = null;
      this.prediction.resetForSource(this.sourceSessionId, receiptEpochMs);
    }
    this.streamMode = packet.replay;
    const timestampMs = this.clock.timestamp(packet, receiptEpochMs);
    const result = this.aggregator.ingest(packet, timestampMs);
    if (!result.accepted) {
      this.rejectedPackets += 1;
      return { accepted: false, malformed: false, rejection: result.rejection, snapshot: this.snapshot };
    }

    this.acceptedPackets += 1;
    this.lastPacketAt = timestampMs;
    const previous = this.probes[packet.sensorPosition];
    this.probes[packet.sensorPosition] = {
      temperatureC: packet.temperatureC,
      state: packet.temperatureError ? "sensor-error" : "ready",
      lastSeenAt: timestampMs,
      sampleCount: previous.sampleCount + (packet.temperatureError ? 0 : 1),
    };
    this.prediction.updateRows(result.rows, result.completed, this.sourceSessionId);
    return { accepted: true, malformed: false, rejection: null, snapshot: this.snapshot };
  }

  finishReplay(): Edge3PipelineSnapshot {
    const result = this.aggregator.finishReplay();
    this.prediction.updateRows(result.rows, result.completed, this.sourceSessionId);
    return this.snapshot;
  }

  restoreHistory(rows: readonly Edge3AggregateRow[], sourceSessionId: string, at = monotonicEpochNow()): boolean {
    if (!this.aggregator.restoreCompleted(rows)) return false;
    if (!this.prediction.restoreRows(rows, sourceSessionId, at)) {
      this.aggregator.reset();
      return false;
    }
    this.sourceSessionId = sourceSessionId;
    this.streamMode = false;
    this.lastPacketAt = rows[rows.length - 1].timestampMs;
    this.probes = emptyProbes();
    rows.forEach((row) => {
      for (const position of EDGE3_SENSOR_POSITIONS ? Object.values(EDGE3_SENSOR_POSITIONS) : []) {
        const value = row.probes[position];
        if (value === null) continue;
        const probe = this.probes[position];
        this.probes[position] = {
          temperatureC: value,
          state: "ready",
          lastSeenAt: row.timestampMs,
          sampleCount: probe.sampleCount + 1,
        };
      }
    });
    return true;
  }

  interrupt(at: number): Edge3PipelineSnapshot {
    this.prediction.interruptActiveEvent(at);
    return this.snapshot;
  }

  clearForecastEvents(): void {
    this.prediction.clearEvents();
  }

  get sensorPositions(): readonly Edge3SensorPosition[] {
    return EDGE3_SENSOR_POSITIONS ? Object.values(EDGE3_SENSOR_POSITIONS) : [];
  }
}
