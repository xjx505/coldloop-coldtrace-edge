import type { TelemetrySample } from "./protocol";

function bytes(hex: string): Uint8Array {
  return Uint8Array.from(hex.trim().split(/\s+/).map((part) => Number.parseInt(part, 16)));
}

// Fixed byte vectors independently transcribed from the 20-byte BLE contract.
export const GOLDEN_FIXTURES = {
  normal: bytes("01 00 E0 01 08 20 84 03 50 00 C2 01 01 00 00 20 D0 07 00 00"),
  ensWarmup: bytes("02 00 E0 01 08 20 89 03 FF FF FF FF 00 04 00 20 A0 0F 00 00"),
  temperatureExcursion: bytes("03 00 9D 03 B0 1D 84 03 2C 01 84 03 01 00 10 21 70 17 00 00"),
  airVocExcursion: bytes("04 00 E0 01 08 20 40 06 B6 03 20 03 04 00 1E 26 40 1F 00 00"),
  combinedWarning: bytes("05 00 9D 03 B0 1D 40 06 B6 03 4C 04 04 00 55 27 10 27 00 00"),
  dhtFault: bytes("06 00 00 00 00 00 84 03 50 00 C2 01 01 00 0A 28 D0 2E 00 00"),
  ensFault: bytes("07 00 E0 01 08 20 84 03 00 00 00 00 00 FF 0A 30 A0 38 00 00"),
} satisfies Record<string, Uint8Array>;

export function fixtureSample(name: keyof typeof GOLDEN_FIXTURES): TelemetrySample {
  const bytesValue = GOLDEN_FIXTURES[name];
  const view = new DataView(bytesValue.buffer, bytesValue.byteOffset, bytesValue.byteLength);
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
