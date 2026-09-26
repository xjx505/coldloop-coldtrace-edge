import type { Edge3AggregateRow } from "./aggregation";
import { PRODUCTION_MODEL_ID } from "./productionModel";
import type { ForecastEvent } from "./prediction";

const EVENTS_KEY = "coldloop.coldtrace.events.v1";
const HISTORY_KEY = "coldloop.coldtrace.history.v1";
const MAX_FORECAST_EVENTS = 100;
const POSITIONS = ["Front_Middle", "Middle_Middle", "Rear_Middle"] as const;

function storageAvailable(): boolean {
  try { return typeof localStorage !== "undefined"; } catch { return false; }
}

function validForecastEvent(value: unknown): value is ForecastEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ForecastEvent>;
  return typeof event.id === "string"
    && typeof event.sourceSessionId === "string"
    && typeof event.modelVersion === "string"
    && (event.modelRole === "production" || event.modelRole === "s2-heldout-evaluation")
    && typeof event.startedAt === "number" && Number.isFinite(event.startedAt)
    && (event.endedAt === null || typeof event.endedAt === "number" && Number.isFinite(event.endedAt))
    && (event.status === "active" || event.status === "recovered" || event.status === "interrupted")
    && typeof event.peakRawScore === "number" && Number.isFinite(event.peakRawScore)
    && typeof event.threshold === "number" && Number.isFinite(event.threshold);
}

export function loadForecastEvents(now = Date.now()): ForecastEvent[] {
  if (!storageAvailable()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(EVENTS_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validForecastEvent).slice(0, MAX_FORECAST_EVENTS).map((event) => event.status === "active"
      ? { ...event, status: "interrupted", endedAt: event.endedAt ?? now }
      : { ...event });
  } catch { return []; }
}

export function saveForecastEvents(events: readonly ForecastEvent[]): void {
  if (!storageAvailable()) return;
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, MAX_FORECAST_EVENTS))); } catch { /* Local storage may be disabled. */ }
}

export interface PersistedEdge3History {
  sourceIdentity: string;
  modelVersion: typeof PRODUCTION_MODEL_ID;
  lastValidTimestamp: number;
  rows: Edge3AggregateRow[];
}

function validHistory(value: unknown): value is PersistedEdge3History {
  if (!value || typeof value !== "object") return false;
  const history = value as Partial<PersistedEdge3History>;
  if (typeof history.sourceIdentity !== "string" || history.sourceIdentity.length === 0
    || history.modelVersion !== PRODUCTION_MODEL_ID
    || typeof history.lastValidTimestamp !== "number" || !Number.isFinite(history.lastValidTimestamp)
    || !Array.isArray(history.rows) || history.rows.length > 7) return false;
  let previous = 0;
  return history.rows.every((row, index) => {
    if (!row || typeof row !== "object" || typeof row.timestampMs !== "number" || !Number.isFinite(row.timestampMs)
      || typeof row.sampleCount !== "number" || !Number.isInteger(row.sampleCount) || row.sampleCount < 0
      || typeof row.validProbeCount !== "number" || !Number.isInteger(row.validProbeCount) || row.validProbeCount < 0 || row.validProbeCount > 3
      || typeof row.sensorErrorCount !== "number" || !Number.isInteger(row.sensorErrorCount) || row.sensorErrorCount < 0
      || typeof row.gap !== "boolean" || !row.probes || typeof row.probes !== "object") return false;
    if (index > 0 && row.timestampMs - previous !== 600_000) return false;
    previous = row.timestampMs;
    return POSITIONS.every((position) => row.probes[position] === null
      || typeof row.probes[position] === "number" && Number.isFinite(row.probes[position]));
  });
}

export function loadEdge3History(sourceIdentity: string, now = Date.now()): PersistedEdge3History | null {
  if (!storageAvailable()) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "null") as unknown;
    if (!validHistory(parsed) || parsed.sourceIdentity !== sourceIdentity || parsed.rows.length !== 7) return null;
    if (parsed.lastValidTimestamp !== parsed.rows[6].timestampMs || parsed.lastValidTimestamp > now + 60_000) return null;
    return { ...parsed, rows: parsed.rows.map((row) => ({ ...row, probes: { ...row.probes } })) };
  } catch { return null; }
}

export function saveEdge3History(history: PersistedEdge3History | null): void {
  if (!storageAvailable()) return;
  try {
    if (!history || !validHistory(history) || history.modelVersion !== PRODUCTION_MODEL_ID) localStorage.removeItem(HISTORY_KEY);
    else localStorage.setItem(HISTORY_KEY, JSON.stringify({ ...history, rows: history.rows.slice(-7) }));
  } catch { /* Local storage may be disabled. */ }
}

export function clearColdTracePersistence(): void {
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(EVENTS_KEY);
    localStorage.removeItem(HISTORY_KEY);
  } catch { /* Local storage may be disabled. */ }
}
