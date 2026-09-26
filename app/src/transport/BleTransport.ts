import { BleClient } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import { SERVICE_UUID, TELEMETRY_UUID } from "../domain/protocol";
import { EDGE3_SERVICE_UUID, EDGE3_TELEMETRY_UUID } from "../domain/edge3Protocol";
import { TransportError, type TelemetryTransport, type TransportHandlers } from "./TelemetryTransport";

const CONNECTION_TIMEOUT_MS = 15_000;

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => reject(new TransportError("timeout", "Connection timed out.")), ms);
    promise.then(
      (value) => { globalThis.clearTimeout(timer); resolve(value); },
      (error) => { globalThis.clearTimeout(timer); reject(error); },
    );
  });
}

export interface BleProfile {
  kind: "ble" | "edge3-ble";
  serviceUuid: string;
  telemetryUuid: string;
}

export const COLDLOOP_BLE_PROFILE: BleProfile = {
  kind: "ble",
  serviceUuid: SERVICE_UUID,
  telemetryUuid: TELEMETRY_UUID,
};

export const EDGE3_BLE_PROFILE: BleProfile = {
  kind: "edge3-ble",
  serviceUuid: EDGE3_SERVICE_UUID,
  telemetryUuid: EDGE3_TELEMETRY_UUID,
};

export class BleTransport implements TelemetryTransport {
  readonly kind: "ble" | "edge3-ble";

  private handlers?: TransportHandlers;
  private deviceId?: string;
  private notificationsStarted = false;
  private connected = false;
  private manualDisconnect = false;

  constructor(private readonly profile: BleProfile = COLDLOOP_BLE_PROFILE) {
    this.kind = profile.kind;
  }

  setHandlers(handlers: TransportHandlers): void {
    this.handlers = handlers;
  }

  get connectedDeviceId(): string | null {
    return this.deviceId ?? null;
  }

  async connect(): Promise<void> {
    try {
      this.handlers?.onStatus("scanning");
      await BleClient.initialize({ androidNeverForLocation: Capacitor.getPlatform() === "android" });
      if (!(await BleClient.isEnabled())) {
        throw new TransportError("bluetooth-off", "Bluetooth is turned off.");
      }

      const device = await BleClient.requestDevice({ services: [this.profile.serviceUuid] });
      this.deviceId = device.deviceId;
      this.handlers?.onSourceIdentity?.(`${this.profile.kind}:${device.deviceId}`);
      this.handlers?.onStatus("connecting");

      // Clear a stale GATT state before reconnecting to the same peripheral.
      await BleClient.disconnect(this.deviceId).catch(() => undefined);
      await timeout(BleClient.connect(this.deviceId, (id) => this.onDisconnected(id)), CONNECTION_TIMEOUT_MS);
      this.connected = true;
      await BleClient.startNotifications(this.deviceId, this.profile.serviceUuid, this.profile.telemetryUuid, (value) => {
        this.handlers?.onPacket(value);
      });
      this.notificationsStarted = true;
      this.handlers?.onStatus("connected");
    } catch (error) {
      await this.cleanupPartialConnection();
      const mapped = error instanceof TransportError ? error : this.mapError(error);
      this.handlers?.onError(mapped);
      throw mapped;
    }
  }

  async disconnect(): Promise<void> {
    this.manualDisconnect = true;
    await this.cleanupPartialConnection();
    this.manualDisconnect = false;
    this.handlers?.onStatus("disconnected");
  }

  async requestEnable(): Promise<void> {
    try {
      await BleClient.initialize({ androidNeverForLocation: Capacitor.getPlatform() === "android" });
      await BleClient.requestEnable();
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async openAppSettings(): Promise<void> {
    await BleClient.openAppSettings();
  }

  private async cleanupPartialConnection(): Promise<void> {
    const id = this.deviceId;
    if (!id) return;
    if (this.notificationsStarted) {
      await BleClient.stopNotifications(id, this.profile.serviceUuid, this.profile.telemetryUuid).catch(() => undefined);
    }
    if (this.connected) await BleClient.disconnect(id).catch(() => undefined);
    this.notificationsStarted = false;
    this.connected = false;
    this.deviceId = undefined;
  }

  private onDisconnected(deviceId: string): void {
    if (deviceId !== this.deviceId || this.manualDisconnect) return;
    this.notificationsStarted = false;
    this.connected = false;
    this.deviceId = undefined;
    this.handlers?.onStatus("disconnected");
    this.handlers?.onError(new TransportError("connect-failed", "The sensor link was lost."));
  }

  private mapError(error: unknown): TransportError {
    if (error instanceof TransportError) return error;
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();
    if (lower.includes("permission") || lower.includes("denied")) return new TransportError("permission-denied", message);
    if (lower.includes("cancel") || lower.includes("dismiss")) return new TransportError("cancelled", message);
    if (lower.includes("bluetooth") && (lower.includes("off") || lower.includes("disabled"))) return new TransportError("bluetooth-off", message);
    if (lower.includes("unsupported") || lower.includes("not support") || lower.includes("ble unsupported")) return new TransportError("unsupported", message);
    if (lower.includes("timeout") || lower.includes("timed out")) return new TransportError("timeout", message);
    if (lower.includes("no device") || lower.includes("not found")) return new TransportError("no-device", message);
    return new TransportError("connect-failed", message);
  }
}

export class Edge3BleTransport extends BleTransport {
  constructor() {
    super(EDGE3_BLE_PROFILE);
  }

  get sourceIdentity(): string | null {
    const id = this.connectedDeviceId;
    return id ? `edge3-ble:${id}` : null;
  }
}
