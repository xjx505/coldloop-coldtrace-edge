import traceAsset from "./traces/NORMAL_REPLAY_TRACE.json";
import { Edge3Pipeline } from "./Edge3Pipeline";
import { Edge3ReplayTransport, type Edge3ReplayTrace } from "../transport/Edge3ReplayTransport";

export const PRODUCTION_TRACE_ID = "S3-normal-production-replay";

export function createProductionReplay(sourceSessionId: string, delayMs = 650) {
  const pipeline = new Edge3Pipeline(sourceSessionId);
  const transport = new Edge3ReplayTransport(traceAsset as Edge3ReplayTrace, delayMs);
  return { pipeline, transport, traceId: PRODUCTION_TRACE_ID };
}
