import { MAX_EVENTS, type ColdChainEvent } from "../domain/engine";

const SETTINGS_KEY = "coldloop.settings.v1";
const EVENTS_KEY = "coldloop.events.v1";
export const DEFAULT_THRESHOLD_C = 8;

export interface PersistedSettings {
  thresholdC: number;
}

function storageAvailable(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function loadSettings(): PersistedSettings {
  if (!storageAvailable()) return { thresholdC: DEFAULT_THRESHOLD_C };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { thresholdC: DEFAULT_THRESHOLD_C };
    const value = JSON.parse(raw) as Partial<PersistedSettings>;
    const thresholdC = Number(value.thresholdC);
    if (!Number.isFinite(thresholdC) || thresholdC < 2 || thresholdC > 12) return { thresholdC: DEFAULT_THRESHOLD_C };
    return { thresholdC };
  } catch {
    return { thresholdC: DEFAULT_THRESHOLD_C };
  }
}

export function saveSettings(settings: PersistedSettings): void {
  if (!storageAvailable()) return;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Storage can be disabled by the host. */ }
}

export function loadEvents(): ColdChainEvent[] {
  if (!storageAvailable()) return [];
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as Array<Partial<ColdChainEvent> & Record<string, unknown>>)
      .filter((event) => event && typeof event.id === "string" && typeof event.startedAt === "number" && Number.isFinite(event.startedAt) && typeof event.peak === "number" && Number.isFinite(event.peak))
      .slice(0, MAX_EVENTS)
      .map((event) => {
        const kind = event.kind === "temperature" || event.kind === "air-voc" ? event.kind : "temperature";
        const source = event.source === "ble" ? "ble" : "demo";
        const legacyAir = kind === "air-voc";
        return {
          ...event,
          kind,
          source,
          metric: legacyAir ? "air" : "temperature",
          airTriggerBasis: legacyAir
            ? event.airTriggerBasis === "tvoc" || event.airTriggerBasis === "aqi" || event.airTriggerBasis === "both" || event.airTriggerBasis === "unknown"
              ? event.airTriggerBasis : "unknown"
            : null,
          peakTvoc: typeof event.peakTvoc === "number" && Number.isFinite(event.peakTvoc) ? event.peakTvoc : legacyAir && String(event.metric) === "tvoc" ? Number(event.peak) : null,
          peakAqi: typeof event.peakAqi === "number" && Number.isFinite(event.peakAqi) ? event.peakAqi : null,
          sourceSessionId: typeof event.sourceSessionId === "string" && event.sourceSessionId.length > 0 ? event.sourceSessionId : `legacy-${source}`,
          title: typeof event.title === "string" ? event.title : legacyAir ? "Air / VOC condition changed" : "Temperature above threshold",
          startedAt: Number(event.startedAt),
          endedAt: typeof event.endedAt === "number" && Number.isFinite(event.endedAt) ? event.endedAt : null,
          status: event.status === "recovered" || event.status === "interrupted" ? event.status : "active",
          severity: event.severity === "watch" ? "watch" : "warning",
          peak: Number(event.peak),
          threshold: typeof event.threshold === "number" && Number.isFinite(event.threshold) ? event.threshold : legacyAir ? 700 : DEFAULT_THRESHOLD_C,
        } as ColdChainEvent;
      });
  } catch {
    return [];
  }
}

export function saveEvents(events: ColdChainEvent[]): void {
  if (!storageAvailable()) return;
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, MAX_EVENTS))); } catch { /* Storage can be disabled by the host. */ }
}
