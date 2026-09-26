export type TransportKind = "demo" | "ble" | "edge3-ble" | "replay";
export type ConnectionStatus = "disconnected" | "scanning" | "connecting" | "connected" | "reconnecting" | "error";
export type TransportErrorCode = "bluetooth-off" | "permission-denied" | "no-device" | "cancelled" | "timeout" | "unsupported" | "connect-failed" | "malformed-packet";

export class TransportError extends Error {
  constructor(public readonly code: TransportErrorCode, message: string) {
    super(message);
    this.name = "TransportError";
  }
}

export interface TransportHandlers {
  onStatus(status: ConnectionStatus): void;
  onPacket(packet: DataView | ArrayBuffer | Uint8Array): void;
  onError(error: TransportError): void;
  onComplete?(): void;
  onSourceIdentity?(identity: string): void;
}

export interface TelemetryTransport {
  readonly kind: TransportKind;
  setHandlers(handlers: TransportHandlers): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export function normalizeTransportError(error: unknown): TransportError {
  if (error instanceof TransportError) return error;
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes("permission") || lower.includes("denied")) return new TransportError("permission-denied", message);
  if (lower.includes("cancel") || lower.includes("dismiss")) return new TransportError("cancelled", message);
  if (lower.includes("not found") || lower.includes("no device")) return new TransportError("no-device", message);
  if (lower.includes("timeout") || lower.includes("timed out")) return new TransportError("timeout", message);
  if (lower.includes("not support") || lower.includes("unsupported") || lower.includes("ble unsupported")) return new TransportError("unsupported", message);
  return new TransportError("connect-failed", message);
}
