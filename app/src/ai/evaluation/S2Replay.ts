import traceAsset from "./S2_REPLAY_TRACE.json";
import { Edge3PredictionEngine } from "../prediction";
import { Edge3Pipeline } from "../Edge3Pipeline";
import { Edge3ReplayTransport, type Edge3ReplayTrace } from "../../transport/Edge3ReplayTransport";
import { scoreS2HeldoutWindow } from "./s2Scorer";

export const S2_TRACE_ID = "S2-held-out-evaluation-replay";

export function createS2EvaluationReplay(sourceSessionId: string, delayMs = 1000) {
  const engine = new Edge3PredictionEngine(scoreS2HeldoutWindow, "s2-heldout-evaluation");
  const pipeline = new Edge3Pipeline(sourceSessionId, engine);
  const transport = new Edge3ReplayTransport(traceAsset as Edge3ReplayTrace, delayMs);
  return { pipeline, transport, traceId: S2_TRACE_ID };
}
