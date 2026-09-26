export const SERVICE_UUID = "6d6f0001-7c62-4f44-a4d2-0c5a9b2bca01";
export const TELEMETRY_UUID = "6d6f0002-7c62-4f44-a4d2-0c5a9b2bca01";
export const TELEMETRY_BYTES = 20;

export const FLAGS = {
  TEMP_HIGH: 1 << 0,
  MQ_RISE: 1 << 1,
  TVOC_HIGH: 1 << 2,
  DHT_FAULT: 1 << 3,
  ENS_FAULT: 1 << 4,
  MQ_BASELINE_READY: 1 << 5,
} as const;

export interface TelemetrySample {
  seq: number;
  temperature: number;
  humidity: number;
  mq135Raw: number;
  tvoc: number;
  eco2: number;
  aqi: number;
  ensStatus: number;
  anomaly: number;
  flags: number;
  uptimeMs: number;
}

export type EnsReadiness = "ready" | "warming" | "starting" | "fault";

export function decodeTelemetry(input: DataView | ArrayBuffer | Uint8Array): TelemetrySample {
  const view = input instanceof DataView
    ? input
    : input instanceof Uint8Array
      ? new DataView(input.buffer, input.byteOffset, input.byteLength)
      : new DataView(input);

  if (view.byteLength !== TELEMETRY_BYTES) {
    throw new Error(`Telemetry packet must be ${TELEMETRY_BYTES} bytes; received ${view.byteLength}.`);
  }

  return {
    seq: view.getUint16(0, true),
    temperature: view.getInt16(2, true) / 100,
    humidity: view.getUint16(4, true) / 100,
    mq135Raw: view.getUint16(6, true),
    tvoc: view.getUint16(8, true),
    eco2: view.getUint16(10, true),
    aqi: view.getUint8(12),
    ensStatus: view.getUint8(13),
    anomaly: view.getUint8(14),
    flags: view.getUint8(15),
    uptimeMs: view.getUint32(16, true),
  };
}

export function encodeTelemetry(sample: TelemetrySample): Uint8Array {
  const buffer = new ArrayBuffer(TELEMETRY_BYTES);
  const view = new DataView(buffer);
  view.setUint16(0, sample.seq & 0xffff, true);
  view.setInt16(2, Math.round(sample.temperature * 100), true);
  view.setUint16(4, Math.round(sample.humidity * 100), true);
  view.setUint16(6, sample.mq135Raw, true);
  view.setUint16(8, sample.tvoc, true);
  view.setUint16(10, sample.eco2, true);
  view.setUint8(12, sample.aqi);
  view.setUint8(13, sample.ensStatus);
  view.setUint8(14, sample.anomaly);
  view.setUint8(15, sample.flags);
  view.setUint32(16, sample.uptimeMs >>> 0, true);
  return new Uint8Array(buffer);
}

export function ensReadiness(sample: Pick<TelemetrySample, "ensStatus" | "flags">): EnsReadiness {
  if (sample.flags & FLAGS.ENS_FAULT) return "fault";
  if (sample.ensStatus & 0x40) return "fault"; // ENS160 STATER: device error.
  const validity = (sample.ensStatus >> 2) & 0x03;
  if (validity === 1) return "warming";
  if (validity === 2) return "starting";
  if (validity === 3) return "fault";
  return "ready";
}

export function temperatureTrusted(sample: Pick<TelemetrySample, "flags">): boolean {
  return (sample.flags & FLAGS.DHT_FAULT) === 0;
}

export function humidityTrusted(sample: Pick<TelemetrySample, "flags">): boolean {
  return (sample.flags & FLAGS.DHT_FAULT) === 0;
}
