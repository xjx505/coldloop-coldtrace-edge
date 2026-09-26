export const EDGE3_SERVICE_UUID = "7a4d0001-5fb2-4a4e-9bb9-34afced20001";
export const EDGE3_TELEMETRY_UUID = "7a4d0002-5fb2-4a4e-9bb9-34afced20001";
export const EDGE3_PACKET_BYTES = 15;

export const EDGE3_FLAGS = {
  DOOR_OPEN: 1 << 0,
  REPLAY: 1 << 1,
  SENSOR_ERROR: 1 << 2,
  RECORDED_R2: 1 << 3,
  DOOR_STATE_AVAILABLE: 1 << 4,
} as const;

export type Edge3SensorId = 1 | 2 | 3;
export type Edge3SensorPosition = "Front_Middle" | "Middle_Middle" | "Rear_Middle";

export const EDGE3_SENSOR_POSITIONS: Record<Edge3SensorId, Edge3SensorPosition> = {
  1: "Front_Middle",
  2: "Middle_Middle",
  3: "Rear_Middle",
};

export interface Edge3TelemetryPacket {
  version: 1;
  flags: number;
  sequence: number;
  uptimeMs: number;
  sensorId: Edge3SensorId;
  sensorPosition: Edge3SensorPosition;
  rawTemperatureC: number;
  temperatureC: number | null;
  temperatureError: boolean;
  humidityPercent: number | null;
  batteryMv: number | null;
  doorStateAvailable: boolean;
  doorOpen: boolean | null;
  replay: boolean;
  recordedR2Marker: boolean;
}

export interface Edge3PacketInput {
  sequence: number;
  uptimeMs: number;
  sensorId: Edge3SensorId;
  temperatureC: number | null;
  humidityPercent?: number | null;
  batteryMv?: number | null;
  sensorError?: boolean;
  replay?: boolean;
  recordedR2Marker?: boolean;
  doorStateAvailable?: boolean;
  doorOpen?: boolean;
}

function dataView(input: DataView | ArrayBuffer | Uint8Array): DataView {
  if (input instanceof DataView) return input;
  if (input instanceof Uint8Array) return new DataView(input.buffer, input.byteOffset, input.byteLength);
  return new DataView(input);
}

export function decodeEdge3Telemetry(input: DataView | ArrayBuffer | Uint8Array): Edge3TelemetryPacket {
  const view = dataView(input);
  if (view.byteLength !== EDGE3_PACKET_BYTES) {
    throw new Error("EDGE-3 telemetry packet must be 15 bytes; received " + view.byteLength + ".");
  }
  const version = view.getUint8(0);
  if (version !== 1) throw new Error("Unsupported EDGE-3 telemetry version " + version + ".");
  const flags = view.getUint8(1);
  if ((flags & 0xe0) !== 0) throw new Error("EDGE-3 packet sets reserved flag bits.");
  const sensorIdValue = view.getUint8(8);
  if (sensorIdValue !== 1 && sensorIdValue !== 2 && sensorIdValue !== 3) {
    throw new Error("EDGE-3 sensor ID must be 1, 2 or 3.");
  }
  const rawTemperatureC = view.getInt16(9, true) / 100;
  const sensorErrorFlag = (flags & EDGE3_FLAGS.SENSOR_ERROR) !== 0;
  const inRange = Number.isFinite(rawTemperatureC) && rawTemperatureC >= -55 && rawTemperatureC <= 125;
  const temperatureError = sensorErrorFlag || !inRange;
  const rawHumidity = view.getUint16(11, true);
  const rawBattery = view.getUint16(13, true);
  const doorStateAvailable = (flags & EDGE3_FLAGS.DOOR_STATE_AVAILABLE) !== 0;
  return {
    version: 1,
    flags,
    sequence: view.getUint16(2, true),
    uptimeMs: view.getUint32(4, true),
    sensorId: sensorIdValue,
    sensorPosition: EDGE3_SENSOR_POSITIONS[sensorIdValue],
    rawTemperatureC,
    temperatureC: temperatureError ? null : rawTemperatureC,
    temperatureError,
    humidityPercent: rawHumidity === 0xffff ? null : rawHumidity / 100,
    batteryMv: rawBattery === 0xffff ? null : rawBattery,
    doorStateAvailable,
    doorOpen: doorStateAvailable ? (flags & EDGE3_FLAGS.DOOR_OPEN) !== 0 : null,
    replay: (flags & EDGE3_FLAGS.REPLAY) !== 0,
    recordedR2Marker: (flags & EDGE3_FLAGS.RECORDED_R2) !== 0,
  };
}

export function encodeEdge3Telemetry(packet: Edge3PacketInput): Uint8Array {
  const buffer = new ArrayBuffer(EDGE3_PACKET_BYTES);
  const view = new DataView(buffer);
  let flags = 0;
  if (packet.sensorError || packet.temperatureC === null) flags |= EDGE3_FLAGS.SENSOR_ERROR;
  if (packet.replay) flags |= EDGE3_FLAGS.REPLAY;
  if (packet.recordedR2Marker) flags |= EDGE3_FLAGS.RECORDED_R2;
  if (packet.doorStateAvailable) flags |= EDGE3_FLAGS.DOOR_STATE_AVAILABLE;
  if (packet.doorStateAvailable && packet.doorOpen) flags |= EDGE3_FLAGS.DOOR_OPEN;
  view.setUint8(0, 1);
  view.setUint8(1, flags);
  view.setUint16(2, packet.sequence & 0xffff, true);
  view.setUint32(4, packet.uptimeMs >>> 0, true);
  view.setUint8(8, packet.sensorId);
  view.setInt16(9, packet.temperatureC === null ? 0 : Math.round(packet.temperatureC * 100), true);
  view.setUint16(11, packet.humidityPercent === null || packet.humidityPercent === undefined
    ? 0xffff : Math.round(packet.humidityPercent * 100), true);
  view.setUint16(13, packet.batteryMv === null || packet.batteryMv === undefined
    ? 0xffff : packet.batteryMv, true);
  return new Uint8Array(buffer);
}

export type SequenceDecision = "accepted" | "duplicate" | "reordered";

export class Edge3SequenceGuard {
  private lastSequence: number | null = null;

  accept(sequence: number): SequenceDecision {
    if (!Number.isInteger(sequence) || sequence < 0 || sequence > 0xffff) return "reordered";
    if (this.lastSequence === null) {
      this.lastSequence = sequence;
      return "accepted";
    }
    const delta = (sequence - this.lastSequence + 0x10000) & 0xffff;
    if (delta === 0) return "duplicate";
    if (delta >= 0x8000) return "reordered";
    this.lastSequence = sequence;
    return "accepted";
  }

  reset(): void {
    this.lastSequence = null;
  }

  get lastAccepted(): number | null {
    return this.lastSequence;
  }
}
