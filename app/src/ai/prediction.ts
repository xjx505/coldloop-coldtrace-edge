import { validateEdge3Window, type Edge3AggregateRow, type WindowGate } from "./aggregation";
import { scoreProductionWindow, type ModelScore } from "./productionModel";
import type { Edge3FeatureRow } from "./types";

export type ForecastStatus = "building-history" | "paused" | "ready";
export type ForecastEventStatus = "active" | "recovered" | "interrupted";
export type ForecastModelRole = "production" | "s2-heldout-evaluation";
type ForecastScorer = (window: readonly Edge3FeatureRow[]) => ModelScore;

export interface ForecastEvent {
  id: string;
  sourceSessionId: string;
  modelVersion: string;
  modelRole: ForecastModelRole;
  startedAt: number;
  endedAt: number | null;
  status: ForecastEventStatus;
  peakRawScore: number;
  threshold: number;
}

export interface ForecastState {
  status: ForecastStatus;
  reason: "building-history" | "history-gap" | "coverage-insufficient" | null;
  rows: Edge3AggregateRow[];
  latest: ModelScore | null;
  events: ForecastEvent[];
}

function pausedReason(gate: WindowGate): ForecastState["reason"] {
  if (gate === "history-gap") return "history-gap";
  if (gate === "coverage-insufficient") return "coverage-insufficient";
  return null;
}

export class Edge3PredictionEngine {
  constructor(private readonly scorer: ForecastScorer = scoreProductionWindow, private readonly modelRole: ForecastModelRole = "production") {}

  private current: ForecastState = {
    status: "building-history",
    reason: "building-history",
    rows: [],
    latest: null,
    events: [],
  };
  private activeEventId: string | null = null;
  private eventSequence = 0;
  private sourceSessionId = "";

  get snapshot(): ForecastState {
    return {
      ...this.current,
      rows: this.current.rows.map((row) => ({ ...row, probes: { ...row.probes } })),
      events: this.current.events.map((event) => ({ ...event })),
    };
  }

  resetForSource(sourceSessionId: string, at: number): void {
    this.interruptActiveEvent(at);
    this.sourceSessionId = sourceSessionId;
    this.current = {
      status: "building-history",
      reason: "building-history",
      rows: [],
      latest: null,
      events: this.current.events,
    };
  }

  restoreRows(rows: readonly Edge3AggregateRow[], sourceSessionId: string, at: number): boolean {
    if (rows.length !== 7 || validateEdge3Window(rows, this.modelRole === "production") !== "ready") return false;
    this.interruptActiveEvent(at);
    this.sourceSessionId = sourceSessionId;
    const window = rows.slice(-7);
    const latest = this.scorer(window.map((row) => row.probes));
    this.current = {
      status: "ready",
      reason: null,
      rows: window.map((row) => ({ ...row, probes: { ...row.probes } })),
      latest,
      events: this.current.events,
    };
    return true;
  }

  clearEvents(): void {
    this.activeEventId = null;
    this.eventSequence = 0;
    this.current = { ...this.current, events: [] };
  }

  updateRows(rows: readonly Edge3AggregateRow[], completedRows: readonly Edge3AggregateRow[], sourceSessionId: string): ForecastState {
    if (sourceSessionId !== this.sourceSessionId) this.resetForSource(sourceSessionId, Date.now());
    const gate = validateEdge3Window(rows, this.modelRole === "production");
    if (gate !== "ready") {
      this.current = {
        status: gate === "building-history" ? "building-history" : "paused",
        reason: pausedReason(gate),
        rows: rows.slice(-7).map((row) => ({ ...row, probes: { ...row.probes } })),
        latest: this.current.latest,
        events: this.current.events,
      };
      return this.snapshot;
    }
    if (completedRows.length === 0) return this.snapshot;

    let latest = this.current.latest;
    for (const completed of completedRows) {
      const completedIndex = rows.findIndex((row) => row.timestampMs === completed.timestampMs);
      if (completedIndex < 6) continue;
      const window = rows.slice(completedIndex - 6, completedIndex + 1);
      if (validateEdge3Window(window, this.modelRole === "production") !== "ready") continue;
      const score = this.scorer(window.map((row) => row.probes));
      latest = score;
      this.applyScore(score, completed.timestampMs, sourceSessionId);
    }
    this.current = {
      status: "ready",
      reason: null,
      rows: rows.slice(-7).map((row) => ({ ...row, probes: { ...row.probes } })),
      latest,
      events: this.current.events,
    };
    return this.snapshot;
  }

  recordScore(score: ModelScore, at: number, sourceSessionId: string): void {
    if (sourceSessionId !== this.sourceSessionId) this.resetForSource(sourceSessionId, at);
    this.applyScore(score, at, sourceSessionId);
    this.current = { ...this.current, latest: score, status: "ready", reason: null, events: this.current.events };
  }

  interruptActiveEvent(at: number): void {
    if (!this.activeEventId) return;
    this.current = {
      ...this.current,
      events: this.current.events.map((event) => event.id === this.activeEventId
        ? { ...event, status: "interrupted", endedAt: at }
        : event),
    };
    this.activeEventId = null;
  }

  private applyScore(score: ModelScore, at: number, sourceSessionId: string): void {
    if (score.modelAlert) {
      if (this.activeEventId) {
        this.current = {
          ...this.current,
          events: this.current.events.map((event) => event.id === this.activeEventId
            ? { ...event, peakRawScore: Math.max(event.peakRawScore, score.rawScore) }
            : event),
        };
      } else {
        this.eventSequence += 1;
        const event: ForecastEvent = {
          id: `forecast-${sourceSessionId}-${at}-${this.eventSequence}`,
          sourceSessionId,
          modelVersion: score.modelVersion,
          modelRole: this.modelRole,
          startedAt: at,
          endedAt: null,
          status: "active",
          peakRawScore: score.rawScore,
          threshold: score.threshold,
        };
        this.current = { ...this.current, events: [event, ...this.current.events] };
        this.activeEventId = event.id;
      }
      return;
    }
    if (!this.activeEventId) return;
    this.current = {
      ...this.current,
      events: this.current.events.map((event) => event.id === this.activeEventId
        ? { ...event, status: "recovered", endedAt: at }
        : event),
    };
    this.activeEventId = null;
  }
}

export function forecastStatusForGate(gate: WindowGate): ForecastStatus {
  return gate === "ready" ? "ready" : gate === "building-history" ? "building-history" : "paused";
}


