import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GOLDEN_FIXTURES } from "../domain/fixtures";
import { SERVICE_UUID, TELEMETRY_UUID } from "../domain/protocol";
import { BleTransport, Edge3BleTransport } from "./BleTransport";
import { EDGE3_SERVICE_UUID, EDGE3_TELEMETRY_UUID } from "../domain/edge3Protocol";

const ble = vi.hoisted(() => ({
  initialize: vi.fn(),
  isEnabled: vi.fn(),
  requestDevice: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  startNotifications: vi.fn(),
  stopNotifications: vi.fn(),
  requestEnable: vi.fn(),
  openAppSettings: vi.fn(),
}));

vi.mock("@capacitor-community/bluetooth-le", () => ({ BleClient: ble }));
vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform: () => "android" } }));

function packetView(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

describe("native BLE transport", () => {
  let onDisconnect: ((deviceId: string) => void) | undefined;
  let onNotification: ((value: DataView) => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    onDisconnect = undefined;
    onNotification = undefined;
    ble.initialize.mockResolvedValue(undefined);
    ble.isEnabled.mockResolvedValue(true);
    ble.requestDevice.mockResolvedValue({ deviceId: "node-01", name: "ColdLoop-01" });
    ble.connect.mockImplementation(async (_deviceId, callback) => { onDisconnect = callback; });
    ble.disconnect.mockResolvedValue(undefined);
    ble.startNotifications.mockImplementation(async (_deviceId, _service, _characteristic, callback) => { onNotification = callback; });
    ble.stopNotifications.mockResolvedValue(undefined);
  });

  afterEach(() => vi.useRealTimers());

  it("initializes Android permissions, filters the firmware service and starts one shared notification stream", async () => {
    const transport = new BleTransport();
    const onPacket = vi.fn();
    const onStatus = vi.fn();
    const onError = vi.fn();
    transport.setHandlers({ onPacket, onStatus, onError });

    await transport.connect();
    expect(ble.initialize).toHaveBeenCalledWith({ androidNeverForLocation: true });
    expect(ble.requestDevice).toHaveBeenCalledWith({ services: [SERVICE_UUID] });
    expect(ble.startNotifications).toHaveBeenCalledTimes(1);
    expect(ble.startNotifications).toHaveBeenCalledWith("node-01", SERVICE_UUID, TELEMETRY_UUID, expect.any(Function));
    onNotification?.(packetView(GOLDEN_FIXTURES.normal));
    expect(onPacket).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenLastCalledWith("connected");

    await transport.disconnect();
    expect(ble.stopNotifications).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("filters the separate EDGE-3 service and subscribes to its 15-byte characteristic", async () => {
    const transport = new Edge3BleTransport();
    transport.setHandlers({ onPacket: vi.fn(), onStatus: vi.fn(), onError: vi.fn() });
    await transport.connect();
    expect(transport.kind).toBe("edge3-ble");
    expect(ble.requestDevice).toHaveBeenCalledWith({ services: [EDGE3_SERVICE_UUID] });
    expect(ble.startNotifications).toHaveBeenCalledWith("node-01", EDGE3_SERVICE_UUID, EDGE3_TELEMETRY_UUID, expect.any(Function));
    await transport.disconnect();
    expect(ble.stopNotifications).toHaveBeenCalledWith("node-01", EDGE3_SERVICE_UUID, EDGE3_TELEMETRY_UUID);
  });

  it("reports a dropped GATT link and allows a clean reconnect without multiplying callbacks", async () => {
    const transport = new BleTransport();
    const onPacket = vi.fn();
    const onStatus = vi.fn();
    const onError = vi.fn();
    transport.setHandlers({ onPacket, onStatus, onError });

    await transport.connect();
    onDisconnect?.("node-01");
    expect(onStatus).toHaveBeenLastCalledWith("disconnected");
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "The sensor link was lost." }));

    await transport.connect();
    onNotification?.(packetView(GOLDEN_FIXTURES.normal));
    expect(ble.startNotifications).toHaveBeenCalledTimes(2);
    expect(onPacket).toHaveBeenCalledTimes(1);
    await transport.disconnect();
    expect(ble.stopNotifications).toHaveBeenCalledTimes(1);
  });

  it("maps disabled Bluetooth and denied permission to actionable transport errors", async () => {
    const off = new BleTransport();
    off.setHandlers({ onPacket: vi.fn(), onStatus: vi.fn(), onError: vi.fn() });
    ble.isEnabled.mockResolvedValueOnce(false);
    await expect(off.connect()).rejects.toMatchObject({ code: "bluetooth-off" });
    expect(ble.requestDevice).not.toHaveBeenCalled();

    const denied = new BleTransport();
    const onError = vi.fn();
    denied.setHandlers({ onPacket: vi.fn(), onStatus: vi.fn(), onError });
    ble.requestDevice.mockRejectedValueOnce(new Error("permission denied"));
    await expect(denied.connect()).rejects.toMatchObject({ code: "permission-denied" });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "permission-denied" }));
  });

  it("maps GATT failure and connection timeout to actionable transport errors", async () => {
    vi.useFakeTimers();
    const failed = new BleTransport();
    failed.setHandlers({ onPacket: vi.fn(), onStatus: vi.fn(), onError: vi.fn() });
    ble.connect.mockRejectedValueOnce(new Error("GATT connection failed"));
    await expect(failed.connect()).rejects.toMatchObject({ code: "connect-failed" });

    const timed = new BleTransport();
    timed.setHandlers({ onPacket: vi.fn(), onStatus: vi.fn(), onError: vi.fn() });
    ble.connect.mockImplementationOnce(() => new Promise<void>(() => undefined));
    const timeoutAssertion = expect(timed.connect()).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(15_000);
    await timeoutAssertion;
  });
});
