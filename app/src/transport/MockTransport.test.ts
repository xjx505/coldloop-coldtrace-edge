import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeTelemetry, FLAGS } from "../domain/protocol";
import { MockTransport } from "./MockTransport";

describe("MockTransport", () => {
  afterEach(() => vi.useRealTimers());

  it("uses binary packets and emits exactly one stream across repeated connect cycles", async () => {
    vi.useFakeTimers();
    const transport = new MockTransport(50);
    const states: string[] = [];
    const packets: Uint8Array[] = [];
    transport.setHandlers({
      onStatus: (status) => states.push(status),
      onPacket: (packet) => packets.push(packet instanceof Uint8Array ? packet : new Uint8Array(packet instanceof DataView ? packet.buffer : packet)),
      onError: (error) => { throw error; },
    });
    transport.setScenario("temperature-warning");

    for (let cycle = 0; cycle < 2; cycle++) {
      const connected = transport.connect();
      await vi.advanceTimersByTimeAsync(100);
      await connected;
      await vi.advanceTimersByTimeAsync(2000);
      await transport.disconnect();
    }

    expect(states.filter((status) => status === "connected")).toHaveLength(2);
    expect(packets).toHaveLength(6);
    const decoded = packets.map(decodeTelemetry);
    expect(decoded.every((sample) => sample.temperature === 9.2)).toBe(true);
    expect(decoded.every((sample) => (sample.flags & FLAGS.TEMP_HIGH) !== 0)).toBe(true);
  });
});
