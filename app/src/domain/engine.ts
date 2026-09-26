import { ensReadiness, FLAGS, humidityTrusted, temperatureTrusted, type TelemetrySample } from "./protocol";

export type EventStatus = "active" | "recovered" | "interrupted";
export type EventSource = "demo" | "ble";
export type EventKind = "temperature" | "air-voc";

export type AirTriggerBasis = "tvoc" | "aqi" | "both" | "unknown";

export interface ColdChainEvent {
  id: string;
  kind: EventKind;
  title: string;
  metric: "temperature" | "air";
  airTriggerBasis: AirTriggerBasis | null;
  peakTvoc: number | null;
  peakAqi: number | null;
  startedAt: number;
  endedAt: number | null;
  status: EventStatus;
  severity: "watch" | "warning";
  peak: number;
  threshold: number;
  source: EventSource;
  sourceSessionId: string;
}

export interface ObservedSample extends TelemetrySample {
  receivedAt: number;
}

export interface EngineSnapshot {
  sample: ObservedSample;
  samples: ObservedSample[];
  events: ColdChainEvent[];
}

interface RuleTracker {
  breachCount: number;
  breachSince: number | null;
  recoveryCount: number;
  eventId: string | null;
  airTriggerBasis: AirTriggerBasis | null;
}

export const MAX_SAMPLES = 120;
export const MAX_EVENTS = 100;

export class ConditionEngine {
  private currentEvents: ColdChainEvent[];
  private currentSamples: ObservedSample[] = [];
  private trackers = new Map<string, RuleTracker>();
  private idCounter = 0;

  constructor(private thresholdC: number, events: ColdChainEvent[] = []) {
    this.currentEvents = events.slice(0, MAX_EVENTS).map((event) => {
      if (event.status !== "active") return event;
      return { ...event, status: "interrupted", endedAt: event.endedAt ?? Date.now() };
    });
    for (const event of this.currentEvents) {
      if (event.status === "active") this.tracker(event.kind, event.sourceSessionId).eventId = event.id;
    }
  }

  setThreshold(value: number): void {
    this.thresholdC = value;
  }

  get events(): ColdChainEvent[] {
    return [...this.currentEvents];
  }

  get samples(): ObservedSample[] {
    return [...this.currentSamples];
  }

  clearEvents(): void {
    this.currentEvents = [];
    this.trackers.clear();
  }

  interruptActiveEvents(at: number): void {
    const activeIds = new Set(this.currentEvents.filter((event) => event.status === "active").map((event) => event.id));
    this.trackers.clear();
    if (activeIds.size === 0) return;
    this.currentEvents = this.currentEvents.map((event) => activeIds.has(event.id)
      ? { ...event, status: "interrupted", endedAt: at }
      : event);
  }

  clearSamples(): void {
    this.currentSamples = [];
  }

  ingest(sample: TelemetrySample, receivedAt: number, source: EventSource, sourceSessionId = "coldloop-default"): EngineSnapshot {
    const observed: ObservedSample = { ...sample, receivedAt };
    this.currentSamples = [...this.currentSamples, observed].slice(-MAX_SAMPLES);

    const tempValid = temperatureTrusted(sample);
    this.updateRule("temperature", tempValid && sample.temperature > this.thresholdC,
      tempValid && sample.temperature <= this.thresholdC - 0.3, sample.temperature,
      this.thresholdC, "Temperature above threshold", receivedAt, source, sourceSessionId);

    const airReady = ensReadiness(sample) === "ready";
    const tvocHigh = airReady && sample.tvoc >= 700;
    const aqiHigh = airReady && sample.aqi >= 4;
    const airHigh = tvocHigh || aqiHigh;
    const airRecovered = airReady && sample.tvoc < 650 && sample.aqi < 4;
    const airTriggerBasis: AirTriggerBasis | null = tvocHigh && aqiHigh ? "both" : tvocHigh ? "tvoc" : aqiHigh ? "aqi" : null;
    const triggerValue = airTriggerBasis === "aqi" ? sample.aqi : sample.tvoc;
    const triggerThreshold = airTriggerBasis === "aqi" ? 4 : 700;
    this.updateRule("air-voc", airHigh, airRecovered, triggerValue,
      triggerThreshold, "Air / VOC condition changed", receivedAt, source, sourceSessionId,
      { triggerBasis: airTriggerBasis, tvoc: airReady ? sample.tvoc : null, aqi: airReady ? sample.aqi : null });

    return { sample: observed, samples: this.samples, events: this.events };
  }

  private tracker(kind: EventKind, sourceSessionId: string): RuleTracker {
    const key = `${sourceSessionId}:${kind}`;
    let tracker = this.trackers.get(key);
    if (!tracker) {
      tracker = { breachCount: 0, breachSince: null, recoveryCount: 0, eventId: null, airTriggerBasis: null };
      this.trackers.set(key, tracker);
    }
    return tracker;
  }

  private updateRule(
    kind: EventKind,
    breached: boolean,
    recovered: boolean,
    value: number,
    threshold: number,
    title: string,
    at: number,
    source: EventSource,
    sourceSessionId: string,
    airReadings: { triggerBasis: AirTriggerBasis | null; tvoc: number | null; aqi: number | null } | null = null,
  ): void {
    const tracker = this.tracker(kind, sourceSessionId);
    if (breached) {
      if (tracker.breachSince === null) {
        tracker.breachSince = at;
        tracker.airTriggerBasis = airReadings?.triggerBasis ?? null;
      }
      tracker.breachCount += 1;
      tracker.recoveryCount = 0;
      if (!tracker.eventId && tracker.breachCount >= 3 && at - tracker.breachSince >= 1_500) {
        this.idCounter += 1;
        const event: ColdChainEvent = {
          id: `${kind}-${at}-${this.idCounter}`,
          kind,
          title,
          metric: kind === "temperature" ? "temperature" : "air",
          airTriggerBasis: tracker.airTriggerBasis,
          peakTvoc: airReadings?.tvoc ?? null,
          peakAqi: airReadings?.aqi ?? null,
          startedAt: tracker.breachSince,
          endedAt: null,
          status: "active",
          severity: kind === "temperature" ? "warning" : "watch",
          peak: value,
          threshold,
          source,
          sourceSessionId,
        };
        this.currentEvents = [event, ...this.currentEvents].slice(0, MAX_EVENTS);
        tracker.eventId = event.id;
      } else if (tracker.eventId) {
        this.updateEvent(tracker.eventId, (event) => ({
          ...event,
          peak: Math.max(event.peak, value),
          ...(airReadings ? {
            peakTvoc: airReadings.tvoc === null ? event.peakTvoc : Math.max(event.peakTvoc ?? -Infinity, airReadings.tvoc),
            peakAqi: airReadings.aqi === null ? event.peakAqi : Math.max(event.peakAqi ?? -Infinity, airReadings.aqi),
          } : {}),
        }));
      }
      return;
    }

    if (!tracker.eventId) {
      tracker.breachCount = 0;
      tracker.breachSince = null;
      tracker.airTriggerBasis = null;
      return;
    }
    if (!recovered) {
      tracker.recoveryCount = 0;
      return;
    }
    tracker.recoveryCount += 1;
    if (tracker.recoveryCount >= 2) {
      this.updateEvent(tracker.eventId, (event) => ({ ...event, status: "recovered", endedAt: at }));
      tracker.eventId = null;
      tracker.breachCount = 0;
      tracker.breachSince = null;
      tracker.recoveryCount = 0;
      tracker.airTriggerBasis = null;
    }
  }

  private updateEvent(id: string, update: (event: ColdChainEvent) => ColdChainEvent): void {
    this.currentEvents = this.currentEvents.map((event) => event.id === id ? update(event) : event);
  }
}

export function activeEvent(events: ColdChainEvent[], kind?: EventKind): ColdChainEvent | undefined {
  return events.find((event) => event.status === "active" && (kind === undefined || event.kind === kind));
}

export function trustedTemperature(sample: ObservedSample | null): number | null {
  return sample && temperatureTrusted(sample) ? sample.temperature : null;
}

export function trustedHumidity(sample: ObservedSample | null): number | null {
  return sample && humidityTrusted(sample) ? sample.humidity : null;
}

export function mqReadiness(sample: TelemetrySample | null): "no-data" | "collecting" | "baseline" | "rising" {
  if (!sample || sample.mq135Raw === 0) return "no-data";
  if (sample.flags & FLAGS.MQ_RISE) return "rising";
  return sample.flags & FLAGS.MQ_BASELINE_READY ? "baseline" : "collecting";
}
