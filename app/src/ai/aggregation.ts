import {
  Edge3SequenceGuard,
  type Edge3SensorPosition,
  type Edge3TelemetryPacket,
} from "../domain/edge3Protocol";

export const EDGE3_CADENCE_MS = 10 * 60 * 1000;
export const EDGE3_WINDOW_ROWS = 7;
export const EDGE3_MAX_STORED_ROWS = 7;

export interface Edge3AggregateRow {
  timestampMs: number;
  probes: Record<Edge3SensorPosition, number | null>;
  sampleCount: number;
  validProbeCount: number;
  sensorErrorCount: number;
  gap: boolean;
}

interface MutableBucket {
  timestampMs: number;
  samples: Record<Edge3SensorPosition, number[]>;
  sensorErrorCount: number;
}

export type PacketRejection = "duplicate" | "reordered" | "late" | "invalid-time";

export interface AggregationResult {
  accepted: boolean;
  rejection: PacketRejection | null;
  completed: Edge3AggregateRow[];
  rows: Edge3AggregateRow[];
}

function emptySamples(): Record<Edge3SensorPosition, number[]> {
  return { Front_Middle: [], Middle_Middle: [], Rear_Middle: [] };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rowFrom(bucket: MutableBucket): Edge3AggregateRow {
  const probes = {
    Front_Middle: average(bucket.samples.Front_Middle),
    Middle_Middle: average(bucket.samples.Middle_Middle),
    Rear_Middle: average(bucket.samples.Rear_Middle),
  };
  const validProbeCount = Object.values(probes).filter((value) => value !== null).length;
  const sampleCount = Object.values(bucket.samples).reduce((count, values) => count + values.length, 0);
  return {
    timestampMs: bucket.timestampMs,
    probes,
    sampleCount,
    validProbeCount,
    sensorErrorCount: bucket.sensorErrorCount,
    gap: sampleCount === 0,
  };
}

function emptyGap(timestampMs: number): Edge3AggregateRow {
  return {
    timestampMs,
    probes: { Front_Middle: null, Middle_Middle: null, Rear_Middle: null },
    sampleCount: 0,
    validProbeCount: 0,
    sensorErrorCount: 0,
    gap: true,
  };
}

export class Edge3BucketAggregator {
  private sequence = new Edge3SequenceGuard();
  private active: MutableBucket | null = null;
  private completed: Edge3AggregateRow[] = [];
  private lastPacketTime: number | null = null;

  get rows(): Edge3AggregateRow[] {
    return this.completed.map((row) => ({ ...row, probes: { ...row.probes } }));
  }

  get activeBucketStart(): number | null {
    return this.active?.timestampMs ?? null;
  }

  ingest(packet: Edge3TelemetryPacket, timestampMs: number): AggregationResult {
    if (!Number.isFinite(timestampMs) || timestampMs < 0) {
      return this.result(false, "invalid-time", []);
    }
    if (this.lastPacketTime !== null && timestampMs < this.lastPacketTime) {
      return this.result(false, "late", []);
    }
    const bucketStart = Math.floor(timestampMs / EDGE3_CADENCE_MS) * EDGE3_CADENCE_MS;
    if (this.active && bucketStart < this.active.timestampMs) {
      return this.result(false, "late", []);
    }
    const sequence = this.sequence.accept(packet.sequence);
    if (sequence !== "accepted") return this.result(false, sequence, []);

    const justCompleted: Edge3AggregateRow[] = [];
    if (!this.active) {
      const last = this.completed.at(-1);
      if (last && bucketStart <= last.timestampMs) return this.result(false, "late", []);
      if (last) {
        let missingAt = last.timestampMs + EDGE3_CADENCE_MS;
        while (missingAt < bucketStart) {
          const gap = emptyGap(missingAt);
          this.pushCompleted(gap);
          justCompleted.push(gap);
          missingAt += EDGE3_CADENCE_MS;
        }
      }
      this.active = { timestampMs: bucketStart, samples: emptySamples(), sensorErrorCount: 0 };
    }
    if (bucketStart > this.active.timestampMs) {
      justCompleted.push(this.completeActive());
      let missingAt = this.activeTimestampAfterMostRecent();
      while (missingAt < bucketStart) {
        const gap = emptyGap(missingAt);
        this.pushCompleted(gap);
        justCompleted.push(gap);
        missingAt += EDGE3_CADENCE_MS;
      }
      this.active = { timestampMs: bucketStart, samples: emptySamples(), sensorErrorCount: 0 };
    }

    this.lastPacketTime = timestampMs;
    if (packet.temperatureError || packet.temperatureC === null) {
      this.active.sensorErrorCount += 1;
    } else {
      this.active.samples[packet.sensorPosition].push(packet.temperatureC);
    }
    return this.result(true, null, justCompleted);
  }

  finishReplay(): AggregationResult {
    if (!this.active) return this.result(true, null, []);
    const row = this.completeActive();
    return this.result(true, null, [row]);
  }

  reset(): void {
    this.sequence.reset();
    this.active = null;
    this.completed = [];
    this.lastPacketTime = null;
  }

  restoreCompleted(rows: readonly Edge3AggregateRow[]): boolean {
    if (rows.length !== EDGE3_MAX_STORED_ROWS || validateEdge3Window(rows) !== "ready") return false;
    this.active = null;
    this.completed = rows.map((row) => ({ ...row, probes: { ...row.probes } }));
    this.lastPacketTime = rows[rows.length - 1].timestampMs;
    this.sequence.reset();
    return true;
  }

  private completeActive(): Edge3AggregateRow {
    const bucket = this.active;
    if (!bucket) throw new Error("Cannot complete an empty EDGE-3 bucket.");
    const row = rowFrom(bucket);
    this.pushCompleted(row);
    this.active = null;
    return row;
  }

  private activeTimestampAfterMostRecent(): number {
    const last = this.completed.at(-1);
    if (!last) throw new Error("Missing active EDGE-3 bucket boundary.");
    return last.timestampMs + EDGE3_CADENCE_MS;
  }

  private pushCompleted(row: Edge3AggregateRow): void {
    this.completed = [...this.completed, row].slice(-EDGE3_MAX_STORED_ROWS);
  }

  private result(accepted: boolean, rejection: PacketRejection | null, completed: Edge3AggregateRow[]): AggregationResult {
    return { accepted, rejection, completed, rows: this.rows };
  }
}

export type WindowGate = "building-history" | "history-gap" | "coverage-insufficient" | "ready";

export function validateEdge3Window(rows: readonly Edge3AggregateRow[], requireCenterProbe = false): WindowGate {
  if (rows.length < EDGE3_WINDOW_ROWS) return "building-history";
  const window = rows.slice(-EDGE3_WINDOW_ROWS);
  for (let index = 1; index < window.length; index += 1) {
    if (window[index].timestampMs - window[index - 1].timestampMs !== EDGE3_CADENCE_MS) return "history-gap";
  }
  if (window.some((row) => row.gap)) return "history-gap";
  const spatialRows = window.filter((row) => row.validProbeCount >= 2).length;
  if (window[window.length - 1].validProbeCount < 2 || spatialRows < 4
    || (requireCenterProbe && window[window.length - 1].probes.Middle_Middle === null)) return "coverage-insufficient";
  return "ready";
}
