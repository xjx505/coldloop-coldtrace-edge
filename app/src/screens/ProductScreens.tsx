import { useState } from "react";
import { activeEvent, mqReadiness, trustedHumidity, trustedTemperature, type ColdChainEvent } from "../domain/engine";
import { ensReadiness, FLAGS } from "../domain/protocol";
import { DEMO_SCENARIOS, type DemoScenario } from "../transport/MockTransport";
import type { AppController, AppState } from "../state/AppController";
import { Icon } from "../components/Icon";
import { TrendChart } from "../components/TrendChart";
import { AccessibleDialog } from "../components/AccessibleDialog";
import { EDGE3_SENSOR_POSITIONS, EDGE3_SERVICE_UUID, EDGE3_TELEMETRY_UUID, type Edge3SensorPosition } from "../domain/edge3Protocol";
import { PRODUCTION_MODEL_ID } from "../ai/productionModel";

function timeLabel(at: number | null): string {
  if (!at) return "—";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(at);
}

function ageLabel(at: number | null): string {
  if (!at) return "No telemetry yet";
  const seconds = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (seconds < 2) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  return `Updated ${Math.floor(seconds / 60)}m ago`;
}

function durationLabel(start: number, end: number | null): string {
  const seconds = Math.max(0, Math.round(((end ?? Date.now()) - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function temperatureText(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

function connectionText(state: AppState): string {
  if (state.connection === "connected") return "Connected";
  if (state.replayComplete) return "Replay complete";
  if (state.connection === "scanning") return state.transportKind === "demo" ? "Starting" : "Looking for node";
  if (state.connection === "connecting") return "Connecting";
  if (state.connection === "reconnecting") return "Reconnecting";
  if (state.connection === "error") return "Action needed";
  return "Not connected";
}

function conditionLabel(state: AppState): { label: string; tone: string } {
  if (state.isStale) return { label: "Last reading", tone: "quiet" };
  if (activeEvent(state.events, "temperature")) return { label: "Warning", tone: "warning" };
  if (!state.sample) return { label: "No data", tone: "quiet" };
  if (state.sample.flags & FLAGS.DHT_FAULT) return { label: "Check sensor", tone: "watch" };
  if (ensReadiness(state.sample) !== "ready") return { label: "Monitoring", tone: "watch" };
  return { label: "Normal", tone: "normal" };
}

function forecastStatusCopy(status: "building-history" | "paused" | "ready", reason: string | null): string {
  if (status === "building-history") return "Building history";
  if (status === "paused") return reason === "history-gap" ? "Paused · history gap" : "Paused · probe coverage";
  return "Ready";
}

function Edge3TrendChart({ rows }: { rows: NonNullable<AppState["edge3"]>["forecast"]["rows"] }) {
  const positions = Object.values(EDGE3_SENSOR_POSITIONS) as Edge3SensorPosition[];
  const colors = ["#356f54", "#c9803d", "#737b65"];
  const values = rows.flatMap((row) => positions.map((position) => row.probes[position]).filter((value): value is number => value !== null));
  if (rows.length === 0 || values.length === 0) return <div className="edge3-chart-empty">Completed window values appear after each 10-minute bucket.</div>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.8, max - min);
  const y = (value: number) => 91 - ((value - (min - span * 0.12)) / (span * 1.24)) * 72;
  const x = (index: number) => rows.length === 1 ? 160 : 12 + index * (296 / (rows.length - 1));
  return <div className="edge3-chart-wrap">
    <svg className="edge3-chart" viewBox="0 0 320 108" role="img" aria-label={`Completed 10-minute temperature windows. ${positions.map((position) => `${position.replaceAll("_", " ")} ${rows.map((row) => row.probes[position] === null ? "missing" : `${row.probes[position]!.toFixed(1)} degrees Celsius`).join(", ")}`).join(". ")}`}>
      {[24, 58, 92].map((line) => <line key={line} x1="8" x2="312" y1={line} y2={line} className="edge3-grid-line" />)}
      {positions.map((position, seriesIndex) => {
        const paths: string[] = [];
        let segment: string[] = [];
        rows.forEach((row, index) => {
          const value = row.probes[position];
          if (value === null) {
            if (segment.length > 1) paths.push(segment.join(" "));
            segment = [];
            return;
          }
          segment.push(`${segment.length ? "L" : "M"}${x(index).toFixed(1)},${y(value).toFixed(1)}`);
        });
        if (segment.length > 1) paths.push(segment.join(" "));
        return <g key={position}>
          {paths.map((path, pathIndex) => <path key={pathIndex} d={path} fill="none" stroke={colors[seriesIndex]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />)}
          {rows.map((row, index) => row.probes[position] === null ? null : <circle key={`${position}-${index}`} cx={x(index)} cy={y(row.probes[position]!)} r="2.7" fill={colors[seriesIndex]} />)}
        </g>;
      })}
    </svg>
    <div className="edge3-chart-legend">{positions.map((position, index) => <span key={position}><i style={{ background: colors[index] }} />{position.replaceAll("_", " ")}</span>)}</div>
    <ol className="visually-hidden">{rows.map((row) => <li key={row.timestampMs}>{timeLabel(row.timestampMs)}: {positions.map((position) => `${position.replaceAll("_", " ")} ${row.probes[position] === null ? "missing" : `${row.probes[position]!.toFixed(1)} degrees Celsius`}`).join(", ")}</li>)}</ol>
  </div>;
}

function Edge3Live({ state, controller }: { state: AppState; controller: AppController }) {
  const pipeline = state.edge3;
  const forecast = pipeline?.forecast;
  const positions = Object.values(EDGE3_SENSOR_POSITIONS) as Edge3SensorPosition[];
  const isReplay = state.sourceSession?.mode === "production-replay" || state.sourceSession?.mode === "evaluation-replay";
  const isEvaluation = state.sourceSession?.evaluationOnly;
  const stateLabel = forecast ? forecastStatusCopy(forecast.status, forecast.reason) : "Waiting for telemetry";
  return <section className="edge3-live" aria-label="ColdTrace Edge monitoring">
    <div className="edge3-live-heading"><div><span className="section-label">COLDTRACE EDGE</span><h2>{isEvaluation ? "S2 held-out replay" : state.sourceSession?.mode === "production-replay" ? "S3 production replay" : "EDGE-3 live monitoring"}</h2></div>
      {isEvaluation && <span className="source-tag source-simulated">Evaluation only</span>}
    </div>
    {isEvaluation && <p className="evaluation-note">Held-out S2 evaluation · not a deployment result</p>}
    {forecast?.latest?.modelAlert && <button className="forecast-alert" onClick={(clickEvent) => {
      const forecastEvent = state.forecastEvents.find((item) => item.sourceSessionId === pipeline?.sourceSessionId);
      if (forecastEvent) controller.openForecastEvent(forecastEvent.id, clickEvent.currentTarget);
    }}>
      <span className="warning-mark"><Icon name="warning" size={18} /></span><span><strong>Model alert</strong><small>Raw model score crossed the 0.50 threshold.</small></span>
      <Icon name="arrow" size={17} />
    </button>}
    <section className="forecast-card">
      <div className="forecast-card-head"><div><span className="section-label">THERMAL RISK FORECAST</span><span className={`condition-badge ${forecast?.status === "ready" ? forecast.latest?.modelAlert ? "warning" : "normal" : "watch"}`} role="status" aria-live="polite">{stateLabel}</span></div>
      </div>
      {forecast?.status === "ready" && forecast.latest ? <div className="forecast-result">
        <strong>{forecast.latest.rawScore.toFixed(2)}</strong><span>raw model score</span>
        <div className="score-scale" role="img" aria-label={`Raw model score ${forecast.latest.rawScore.toFixed(3)} on a zero to one scale. Alert threshold ${forecast.latest.threshold.toFixed(2)}.`}>
          <i className={forecast.latest.modelAlert ? "score-track alert" : "score-track"}><b style={{ width: `${Math.max(0, Math.min(100, forecast.latest.rawScore * 100))}%` }} /><em style={{ left: `${Math.max(0, Math.min(100, forecast.latest.threshold * 100))}%` }} /></i>
          <div className="forecast-threshold"><span>0</span><span>Alert threshold · {forecast.latest.threshold.toFixed(2)}</span><span>1</span></div>
        </div>
        <p className={`forecast-outcome ${forecast.latest.modelAlert ? "warning" : "normal"}`} role="status" aria-live="polite" aria-atomic="true">{forecast.latest.modelAlert ? "Model alert" : "No model alert"}</p>
        {forecast.latest.modelAlert && <p className="forecast-alert-copy">Model alert · not a direct measurement</p>}
      </div> : <div className="forecast-building">
        <strong>{forecast?.rows.length ?? 0}<small> / 7 completed windows</small></strong>
        <p>{forecast?.reason === "history-gap" ? "A missing 10-minute bucket prevents a result." : forecast?.reason === "coverage-insufficient" ? "At least two probe positions are needed across the recent window." : "A result needs seven consecutive 10-minute windows with sufficient probe coverage."}</p>
      </div>}
      <details className="forecast-details"><summary>How this result is formed</summary>
        <p>On-device model · {forecast?.latest?.modelVersion ?? PRODUCTION_MODEL_ID}. Output is an uncalibrated raw score, not a probability or food-safety measurement.</p>
      </details>
    </section>
    <section className="edge3-probes" aria-label="Probe temperatures">
      {positions.map((position) => {
        const probe = pipeline?.probes[position];
        return <div className="edge3-probe" key={position}><span>{position.replaceAll("_", " ")}</span><strong>{probe?.temperatureC === null || !probe ? "—" : `${probe.temperatureC.toFixed(1)} °C`}</strong><small>{probe?.state === "ready" ? ageLabel(probe.lastSeenAt) : probe?.state === "sensor-error" ? "Sensor error" : "Waiting"}</small></div>;
      })}
    </section>
    <section className="edge3-trend-section"><div className="section-heading"><div><h3>Probe history</h3><p>Completed 10-minute averages</p></div><span className="window-count">{forecast?.rows.length ?? 0} / 7</span></div><Edge3TrendChart rows={forecast?.rows ?? []} /></section>
    {!isReplay && <div className="edge3-live-actions">
      {state.connection === "connected" ? <button className="button-secondary" onClick={() => void controller.disconnect()}>Disconnect node</button> : <button className="button-primary" onClick={() => void controller.connectEdge3Ble()}>Connect EDGE-3</button>}
      <button className="text-action" onClick={() => void controller.startProductionReplay()}>Run S3 replay</button>
    </div>}
  </section>;
}

function airCondition(state: AppState): { label: string; detail: string; tone: string } {
  if (!state.sample) return { label: "No reading", detail: "Waiting for sensor data", tone: "quiet" };
  const readiness = ensReadiness(state.sample);
  if (readiness === "fault") return { label: "Sensor fault", detail: "ENS160 output unavailable", tone: "warning" };
  if (readiness === "warming") return { label: "Warming", detail: "ENS160 values not yet trusted", tone: "watch" };
  if (readiness === "starting") return { label: "Starting", detail: "ENS160 values not yet trusted", tone: "watch" };
  if (state.sample.tvoc >= 700 || state.sample.aqi >= 4) return { label: "Watch", detail: `AQI ${state.sample.aqi} of 5`, tone: "watch" };
  return { label: "Normal", detail: `AQI ${state.sample.aqi || "—"} of 5`, tone: "normal" };
}

function NoticeBanner({ state, controller }: { state: AppState; controller: AppController }) {
  if (!state.notice) return null;
  return (
    <section className={`notice-banner ${state.notice.code === "malformed-packet" ? "notice-soft" : ""}`} role="status">
      <span className="notice-icon"><Icon name={state.notice.code === "malformed-packet" ? "info" : "warning"} /></span>
      <div className="notice-copy"><strong>{state.notice.title}</strong><p>{state.notice.detail}</p></div>
      {state.notice.code === "bluetooth-off" && <button className="text-action" onClick={() => void controller.requestBluetoothOn()}>Turn on</button>}
      {state.notice.code === "permission-denied" && <button className="text-action" onClick={() => void controller.openPermissionSettings()}>Settings</button>}
    </section>
  );
}

export function LiveScreen({ state, controller }: { state: AppState; controller: AppController }) {
  const temperature = trustedTemperature(state.sample);
  const humidity = trustedHumidity(state.sample);
  const air = airCondition(state);
  const condition = conditionLabel(state);
  const isEdge3 = state.sourceSession?.profile === "edge3-15byte";
  const sourceLabel = state.transportKind === "demo" ? "Simulated data" : state.sourceSession?.mode === "physical" ? "BLE" : null;
  const temperatureEvent = activeEvent(state.events, "temperature");
  const airEvent = activeEvent(state.events, "air-voc");

  return (
    <div className="screen-content live-screen" data-screen="live">
      <div className="live-topline">
        <div className="node-label"><span className={`connection-dot ${state.connection === "connected" ? "is-connected" : ""}`} />
          <div><strong>{isEdge3 ? "EDGE-3" : "ColdLoop-01"}</strong><span>{connectionText(state)}</span></div>
        </div>
        {sourceLabel && <span className={`source-tag ${state.transportKind === "demo" ? "source-simulated" : ""}`}>{sourceLabel}</span>}
      </div>

      <NoticeBanner state={state} controller={controller} />

      {isEdge3 ? <Edge3Live state={state} controller={controller} /> : state.sample === null ? (
        <section className="empty-live">
          <div className="empty-live-heading"><span className="section-label">LIVE CONDITIONS</span><span className="condition-badge quiet">No readings</span></div>
          <h2>Connect a sensor node</h2>
          <p>Live readings and alerts will appear here. Use the deterministic demo if hardware is not nearby.</p>
          <div className="empty-actions">
            <button className="button-primary" onClick={() => void controller.connectBle()} disabled={state.connection === "scanning" || state.connection === "connecting"}>
              <Icon name="link" /> Connect sensor
            </button>
            <button className="button-secondary" onClick={() => void controller.startDemo("normal")}>Try demo</button>
          </div>
          <div className="edge3-entry">
            <div><strong>ColdTrace Edge forecasting</strong><span>Compatible EDGE-3 · three temperature positions</span></div>
            <div><button className="text-action" onClick={() => void controller.connectEdge3Ble()}>Connect EDGE-3</button><button className="text-action" onClick={() => void controller.startProductionReplay()}>Run S3 replay</button></div>
          </div>
        </section>
      ) : (
        <>
          {(temperatureEvent || airEvent) && <button className="warning-banner" aria-live="polite" onClick={(event) => controller.openEvent((temperatureEvent ?? airEvent)!.id, event.currentTarget)}>
            <span className="warning-mark"><Icon name="warning" size={19} /></span>
            <span className="warning-copy"><strong>{temperatureEvent?.title ?? airEvent?.title}</strong>
              <span>{temperatureEvent ? `${temperatureText(temperature)} °C · above ${temperatureEvent.threshold.toFixed(1)} °C for ${durationLabel(temperatureEvent.startedAt, null)}` : `${eventPeak(airEvent!)} · AQI ${state.sample.aqi} / 5`}</span>
            </span>
            <Icon name="arrow" size={18} />
          </button>}

          {state.isStale && <div className="stale-banner"><Icon name="clock" size={17} /><span>Not live · showing the last reading from {timeLabel(state.lastUpdateAt)}</span><button onClick={() => state.transportKind === "demo" ? void controller.startDemo(state.scenario ?? "normal") : void controller.connectBle()}>Reconnect</button></div>}

          <button className="temperature-feature" onClick={(event) => controller.openMetric("temperature", event.currentTarget)} aria-label={`Open temperature details, ${temperatureText(temperature)} degrees Celsius`}>
            <div className="feature-head"><span className="section-label">TEMPERATURE</span><span className={`condition-badge ${condition.tone}`}>{condition.label}</span></div>
            <div className="temperature-value"><strong>{temperatureText(temperature)}</strong><span>°C</span></div>
            <div className="feature-foot"><span>{temperature === null ? "DHT22 · data unavailable" : `Alert above ${state.thresholdC.toFixed(1)} °C`}</span><span className="detail-link">Details <Icon name="arrow" size={15} /></span></div>
          </button>

          <div className="metric-row">
            <button className="metric-tile" onClick={(event) => controller.openMetric("humidity", event.currentTarget)}>
              <span className="tile-head"><Icon name="humidity" size={18} /> HUMIDITY</span>
              <strong>{humidity === null ? "—" : humidity.toFixed(0)}<small>{humidity === null ? "" : "%"}</small></strong>
              <span className="tile-foot">Relative humidity <Icon name="arrow" size={14} /></span>
            </button>
            <button className="metric-tile" onClick={(event) => controller.openMetric("air", event.currentTarget)}>
              <span className="tile-head"><Icon name="air" size={18} /> AIR / VOC</span>
              <strong className={`air-state ${air.tone}`}>{air.label}</strong>
              <span className="tile-foot">{air.detail} <Icon name="arrow" size={14} /></span>
            </button>
          </div>

          <section className="trend-section">
            <div className="section-heading"><div><h2>Temperature trend</h2><p>{ageLabel(state.lastUpdateAt)}</p></div><button className="plain-action" onClick={(event) => controller.openMetric("temperature", event.currentTarget)}>Open <Icon name="arrow" size={15} /></button></div>
            <TrendChart samples={state.samples} thresholdC={state.thresholdC} />
          </section>

          {!temperatureEvent && !airEvent && <div className="recent-event-line"><Icon name="check" size={17} /><span>{state.events[0] ? `Last event ${state.events[0].status === "recovered" ? "recovered" : "interrupted"} · ${timeLabel(state.events[0].endedAt)}` : "No active events"}</span><button onClick={() => controller.navigate("history")}>History</button></div>}
        </>
      )}
    </div>
  );
}

function eventPeak(event: ColdChainEvent): string {
  if (event.metric === "temperature") return `${event.peak.toFixed(1)} °C`;
  if (event.airTriggerBasis === "aqi") return event.peakAqi === null ? "AQI unavailable" : `AQI ${event.peakAqi} / 5`;
  if (event.airTriggerBasis === "both") {
    const tvoc = event.peakTvoc === null ? "TVOC unavailable" : `${event.peakTvoc} ppb TVOC`;
    const aqi = event.peakAqi === null ? "AQI unavailable" : `AQI ${event.peakAqi} / 5`;
    return `${tvoc} · ${aqi}`;
  }
  if (event.airTriggerBasis === "tvoc") return event.peakTvoc === null ? "TVOC unavailable" : `${event.peakTvoc} ppb TVOC`;
  return "Air reading basis not stored";
}

function eventThreshold(event: ColdChainEvent): string {
  if (event.metric === "temperature") return `${event.threshold.toFixed(1)} °C`;
  if (event.airTriggerBasis === "tvoc") return "TVOC ≥700 ppb";
  if (event.airTriggerBasis === "aqi") return "AQI ≥4 / 5";
  if (event.airTriggerBasis === "both") return "TVOC ≥700 ppb and AQI ≥4 / 5 at trigger";
  return "Legacy event · trigger basis not stored";
}

function statusLabel(status: ColdChainEvent["status"]): string {
  if (status === "active") return "Active";
  if (status === "recovered") return "Recovered";
  return "Interrupted";
}

export function HistoryScreen({ state, controller }: { state: AppState; controller: AppController }) {
  const totalEvents = state.events.length + state.forecastEvents.length;
  return (
    <div className="screen-content" data-screen="history">
      <div className="page-heading"><div><span className="section-label">RECORDED EVENTS</span><h2>History</h2></div><span className="count-label">{totalEvents}</span></div>
      {state.forecastEvents.length > 0 && <section className="history-group">
        <div className="history-group-heading"><h3>Thermal model events</h3><span>{state.forecastEvents.length}</span></div>
        <div className="forecast-event-list">{state.forecastEvents.map((event) => <button className={`forecast-event-row ${event.status}`} key={event.id} data-forecast-event-id={event.id} onClick={(clickEvent) => controller.openForecastEvent(event.id, clickEvent.currentTarget)}>
          <span className="forecast-event-indicator"><Icon name={event.modelRole === "s2-heldout-evaluation" ? "info" : event.peakRawScore >= event.threshold ? "warning" : "temperature"} size={17} /></span>
          <span className="forecast-event-main"><strong>{event.peakRawScore >= event.threshold ? "Model alert" : "Forecast event"}</strong><span>{event.modelVersion}</span><span className="forecast-event-meta">{timeLabel(event.startedAt)} · Peak raw score {event.peakRawScore.toFixed(2)} · {event.modelRole === "s2-heldout-evaluation" ? "Held-out evaluation" : "Production"}</span></span>
          <i className={`event-state state-${event.status}`}>{statusLabel(event.status)}</i><Icon name="arrow" size={16} />
        </button>)}</div>
      </section>}
      {state.events.length === 0 && state.forecastEvents.length === 0 ? (
        <section className="empty-panel"><Icon name="history" size={25} /><h3>No events yet</h3><p>Events appear here after a condition stays outside its threshold.</p><button className="button-secondary" onClick={() => void controller.startDemo("temperature-warning")}>Run warning demo</button></section>
      ) : state.events.length > 0 && <section className="history-group">
        <div className="history-group-heading"><h3>ColdLoop conditions</h3><span>{state.events.length}</span></div>
        <div className="event-list">
          {state.events.map((event) => <button className={`event-row ${event.severity}`} key={event.id} data-event-id={event.id} onClick={(clickEvent) => controller.openEvent(event.id, clickEvent.currentTarget)}>
            <span className="event-indicator"><Icon name={event.severity === "warning" ? "temperature" : "air"} size={18} /></span>
            <span className="event-row-main"><strong>{event.title}</strong><span>{timeLabel(event.startedAt)} · Peak {eventPeak(event)}</span><span className="event-row-meta"><i className={`event-state state-${event.status}`}>{statusLabel(event.status)}</i>{event.source === "demo" && <i className="demo-mini">Simulated</i>}<i>{durationLabel(event.startedAt, event.endedAt)}</i></span></span>
            <Icon name="arrow" size={17} />
          </button>)}
        </div>
      </section>}
      <p className="local-note">History is stored on this device.</p>
    </div>
  );
}

type SensorStatus = { name: string; reading: string; state: string; tone: string };

function Edge3Device({ state, controller }: { state: AppState; controller: AppController }) {
  const positions = Object.values(EDGE3_SENSOR_POSITIONS) as Edge3SensorPosition[];
  const replay = state.sourceSession?.mode === "production-replay" || state.sourceSession?.mode === "evaluation-replay";
  const isEvaluation = state.sourceSession?.evaluationOnly;
  return <div className="screen-content" data-screen="device">
    <div className="page-heading"><div><span className="section-label">SOURCE & PROBES</span><h2>Device</h2></div><span className={`condition-badge ${state.connection === "connected" ? "normal" : "quiet"}`}>{connectionText(state)}</span></div>
    <section className="device-connect-panel"><div><strong>{state.sourceSession?.label ?? "ColdTrace Edge"}</strong><span>{replay ? (isEvaluation ? "Held-out S2 trace" : "Recorded S3 trace") : "EDGE-3 · Bluetooth Low Energy"}</span></div>
      {state.connection === "connected" ? <button className="button-secondary compact-button" onClick={() => replay ? void controller.stopReplay() : void controller.disconnect()}>{replay ? "Stop replay" : "Disconnect"}</button>
        : <button className="button-primary compact-button" onClick={() => replay ? void (isEvaluation ? controller.startS2EvaluationReplay() : controller.startProductionReplay()) : void controller.connectEdge3Ble()}>{replay ? "Run again" : "Connect"}</button>}
    </section>
    <section className="sensor-list edge3-device-probes" aria-label="EDGE-3 probe health">
      {positions.map((position) => {
        const probe = state.edge3?.probes[position];
        const tone = probe?.state === "ready" ? "normal" : probe?.state === "sensor-error" ? "warning" : "quiet";
        return <div className="sensor-row" key={position}><div className={`sensor-icon ${tone}`}><Icon name="temperature" size={19} /></div><div className="sensor-copy"><strong>{position.replaceAll("_", " ")}</strong><span>{probe?.temperatureC === null || !probe ? "No valid reading" : `${probe.temperatureC.toFixed(1)} °C · ${ageLabel(probe.lastSeenAt)}`}</span></div><span className={`sensor-status ${tone}`}>{probe?.state === "ready" ? "Ready" : probe?.state === "sensor-error" ? "Fault" : "Waiting"}</span></div>;
      })}
    </section>
    <section className="device-facts">
      <div><span>Profile</span><strong>EDGE-3 · 15-byte v1</strong></div>
      <div><span>Packets</span><strong>{state.edge3?.acceptedPackets ?? 0} accepted · {state.edge3?.rejectedPackets ?? 0} rejected</strong></div>
      <div><span>Last telemetry</span><strong>{state.edge3?.lastPacketAt ? `${timeLabel(state.edge3.lastPacketAt)} · ${ageLabel(state.edge3.lastPacketAt).replace("Updated ", "")}` : "No packet received"}</strong></div>
      <div><span>Forecast</span><strong>{state.sourceSession?.capabilities.thermalForecast ? "Available for EDGE-3" : "Unavailable"}</strong></div>
      <div><span>Inference</span><strong>On-device · no network required</strong></div>
    </section>
    <details className="protocol-details"><summary>Connection details</summary><dl>
      <dt>Transport</dt><dd>{replay ? "Encoded recorded packets" : state.transportKind === "edge3-ble" ? "BLE notifications" : "Disconnected"}</dd>
      <dt>Service UUID</dt><dd>{EDGE3_SERVICE_UUID}</dd>
      <dt>Telemetry UUID</dt><dd>{EDGE3_TELEMETRY_UUID}</dd>
      <dt>Model</dt><dd>{state.edge3?.forecast.latest?.modelVersion ?? PRODUCTION_MODEL_ID}</dd>
    </dl><p className="detail-rule">Recorded R2 outcome markers are not used as model features.</p></details>
  </div>;
}

export function DeviceScreen({ state, controller }: { state: AppState; controller: AppController }) {
  if (state.sourceSession?.profile === "edge3-15byte") return <Edge3Device state={state} controller={controller} />;
  const sample = state.sample;
  const ens = sample ? ensReadiness(sample) : null;
  const mq = mqReadiness(sample);
  const sensors: SensorStatus[] = [
    { name: "DHT22", reading: sample && !(sample.flags & FLAGS.DHT_FAULT) ? `${temperatureText(trustedTemperature(sample))} °C · ${trustedHumidity(sample)?.toFixed(0) ?? "—"}% RH` : sample ? "No valid reading" : "Awaiting telemetry", state: sample ? (sample.flags & FLAGS.DHT_FAULT ? "Fault" : "Ready") : "Waiting", tone: sample && (sample.flags & FLAGS.DHT_FAULT) ? "warning" : sample ? "normal" : "quiet" },
    { name: "ENS160", reading: ens === "ready" ? `AQI ${sample?.aqi || "—"} · ${sample?.tvoc ?? "—"} ppb TVOC` : "Air readings shown after warm-up", state: ens === "ready" ? "Ready" : ens === "warming" ? "Warming" : ens === "starting" ? "Starting" : ens === "fault" ? "Fault" : "Waiting", tone: ens === "ready" ? "normal" : ens === "fault" ? "warning" : ens ? "watch" : "quiet" },
    { name: "MQ-135", reading: sample ? (sample.mq135Raw > 0 ? `ADC ${sample.mq135Raw} · relative response only` : "No ADC response") : "Awaiting telemetry", state: mq === "rising" ? "Response rising" : mq === "baseline" ? "Baseline formed" : mq === "collecting" ? "Collecting baseline" : sample ? "No reading" : "Waiting", tone: mq === "rising" ? "watch" : mq === "baseline" ? "normal" : "quiet" },
  ];
  const isConnected = state.connection === "connected";
  const simulated = state.transportKind === "demo";

  return (
    <div className="screen-content" data-screen="device">
      <div className="page-heading"><div><span className="section-label">NODE & SENSORS</span><h2>Device</h2></div><span className={`condition-badge ${isConnected ? "normal" : "quiet"}`}>{connectionText(state)}</span></div>
      <section className="device-connect-panel">
        <div><strong>ColdLoop-01</strong><span>{simulated ? "Offline simulation" : state.transportKind === "ble" ? "Bluetooth Low Energy" : "ESP32-C3 sensor node"}</span></div>
        {isConnected ? <button className="button-secondary compact-button" onClick={() => void controller.disconnect()}>{simulated ? "Stop simulation" : "Disconnect"}</button> : <button className="button-primary compact-button" onClick={() => simulated ? void controller.startDemo(state.scenario ?? "normal") : void controller.connectBle()}>{simulated ? "Reconnect" : "Connect"}</button>}
      </section>
      <section className="sensor-list" aria-label="Sensor health">
        {sensors.map((sensor) => <div className="sensor-row" key={sensor.name}>
          <div className={`sensor-icon ${sensor.tone}`}><Icon name={sensor.name === "DHT22" ? "temperature" : sensor.name === "ENS160" ? "air" : "device"} size={19} /></div>
          <div className="sensor-copy"><strong>{sensor.name}</strong><span>{sensor.reading}</span></div>
          <span className={`sensor-status ${sensor.tone}`}>{sensor.state}</span>
        </div>)}
      </section>
      <section className="device-facts">
        <div><span>Last telemetry</span><strong>{state.lastUpdateAt ? `${timeLabel(state.lastUpdateAt)} · ${ageLabel(state.lastUpdateAt).replace("Updated ", "")}` : "No packet received"}</strong></div>
      </section>
      <section className="edge3-source-panel"><div><strong>ColdTrace Edge</strong><span>Separate EDGE-3 profile · local thermal forecast</span></div><div><button className="text-action" onClick={() => void controller.connectEdge3Ble()}>Connect</button><button className="text-action" onClick={() => void controller.startProductionReplay()}>S3 replay</button></div></section>
      <details className="protocol-details"><summary>Connection details</summary><dl>
        <dt>Transport</dt><dd>{state.transportKind === "ble" ? "BLE notifications" : simulated ? "Offline simulated packets" : "Disconnected"}</dd>
        <dt>Format</dt><dd>20-byte packed little-endian</dd>
        <dt>Service UUID</dt><dd>6d6f0001-7c62-4f44-a4d2-0c5a9b2bca01</dd>
        <dt>Telemetry UUID</dt><dd>6d6f0002-7c62-4f44-a4d2-0c5a9b2bca01</dd>
      </dl></details>
      <p className="scientific-note">ENS160 eCO₂ is an estimate. MQ-135 is a broad relative signal and does not identify a gas.</p>
    </div>
  );
}

export function SettingsScreen({ state, controller }: { state: AppState; controller: AppController }) {
  const advancedScenarios = DEMO_SCENARIOS.filter((item) => !["normal", "temperature-rising", "recovery"].includes(item.id));
  const initialAdvanced = advancedScenarios.some((item) => item.id === state.scenario) ? state.scenario! : "temperature-warning";
  const [scenario, setScenario] = useLocalScenario(initialAdvanced);
  const isDemo = state.transportKind === "demo";
  return (
    <div className="screen-content" data-screen="settings">
      <section className="setting-section capability-settings">
        <div className="setting-title"><div><strong>{state.sourceSession?.profile === "edge3-15byte" ? "ColdTrace Edge · EDGE-3" : "ColdLoop condition node"}</strong><span>{state.sourceSession?.profile === "edge3-15byte" ? "Three temperature positions · local thermal forecast" : "Temperature, humidity and air/VOC condition monitoring · no forecast"}</span></div></div>
        <p className="setting-footnote">{state.sourceSession?.profile === "edge3-15byte" ? "Inference runs on this device and needs no network. Scores are uncalibrated model outputs." : "ColdTrace forecasting requires a compatible EDGE-3 source and never runs on ColdLoop 20-byte packets."}</p>
      </section>
      {state.sourceSession?.profile !== "edge3-15byte" && <>
      <section className="setting-section">
        <div className="setting-title"><div><strong>Temperature alert</strong><span>After 3 readings stay high for at least 1.5 s.</span></div><output id="threshold-output" aria-live="polite">{state.thresholdC.toFixed(1)} °C</output></div>
        <label className="visually-hidden" htmlFor="temperature-threshold">Temperature alert threshold in degrees Celsius</label>
        <input id="temperature-threshold" name="temperature-threshold" aria-label="Temperature alert threshold in degrees Celsius" aria-describedby="threshold-output" type="range" min="2" max="12" step="0.5" value={state.thresholdC} onChange={(event) => controller.setThreshold(Number(event.currentTarget.value))} />
        <div className="range-labels"><span>2 °C</span><span>12 °C</span></div>
      </section>
      <section className="setting-section simulation-settings">
        <div className="setting-title"><div><strong>Offline simulation</strong><span>Explore changing readings and alerts without a sensor.</span></div></div>
        <div className="simulation-actions" role="group" aria-label="Simulation scenarios">
          {([
            ["normal", "Normal"],
            ["temperature-rising", "Excursion"],
            ["recovery", "Recovery"],
          ] as const).map(([id, label]) => <button className={isDemo && state.scenario === id ? "simulation-button active" : "simulation-button"} key={id} onClick={() => void controller.startDemo(id)} data-setting-scenario={id} aria-pressed={isDemo && state.scenario === id}>{label}</button>)}
        </div>
        {isDemo && <button className="button-secondary stop-demo" onClick={() => void controller.stopDemo()}>Stop simulation</button>}
        <details className="advanced-scenarios">
          <summary>Advanced scenarios</summary>
          <p>Connection and sensor checks.</p>
          <label className="input-label" htmlFor="demo-scenario">Scenario</label>
          <select id="demo-scenario" value={scenario} onChange={(event) => setScenario(event.currentTarget.value as DemoScenario)}>
            {advancedScenarios.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <button className="button-secondary scenario-run" onClick={() => void controller.startDemo(scenario)}>Run scenario</button>
        </details>
      </section>
      <details className="setting-section baseline-details">
        <summary className="setting-title"><div><strong>MQ-135 baseline</strong><span>Relative only · formed from 30 nonzero readings.</span></div></summary>
        <p className="setting-footnote">This is not a gas calibration. Physical warm-up and sensor behavior must be checked on the node.</p>
      </details>
      </>}
      <section className="setting-section history-setting">
        <div className="setting-title"><div><strong>Local event history</strong><span>Up to 100 events of each type are saved on this device.</span></div></div>
        <button className="button-danger-outline" onClick={() => { if (window.confirm("Clear all local ColdLoop and ColdTrace history?")) controller.clearHistory(); }}>Clear history</button>
      </section>
      <p className="scientific-note">This prototype does not certify food safety, estimate spoilage or predict remaining shelf life.</p>
    </div>
  );
}

function useLocalScenario(initial: DemoScenario): [DemoScenario, (scenario: DemoScenario) => void] {
  const [value, setValue] = useState(initial);
  return [value, setValue];
}

export function MetricDetail({ state, controller, metric }: { state: AppState; controller: AppController; metric: "temperature" | "humidity" | "air" }) {
  const sample = state.sample;
  const temperature = trustedTemperature(sample);
  const humidity = trustedHumidity(sample);
  const tempValues = state.samples.map((item) => trustedTemperature(item)).filter((value): value is number => value !== null);
  const humidityValues = state.samples.map((item) => trustedHumidity(item)).filter((value): value is number => value !== null);
  const readiness = sample ? ensReadiness(sample) : null;
  const title = metric === "temperature" ? "Temperature" : metric === "humidity" ? "Humidity" : "Air / VOC";
  return (
    <AccessibleDialog className="detail-view" controller={controller} labelledBy="metric-detail-heading">
      <div className="detail-header"><button className="icon-button back-button" onClick={() => controller.back()} aria-label="Back to live"><Icon name="back" /></button><div><span className="section-label">METRIC DETAIL</span><h2 id="metric-detail-heading" tabIndex={-1}>{title}</h2></div><button className="icon-button" onClick={() => controller.back()} aria-label="Close detail"><Icon name="close" /></button></div>
      {!sample ? <div className="empty-panel"><Icon name="info" size={24} /><h3>No reading yet</h3><p>Connect a sensor or start the deterministic demo.</p><button className="button-secondary" onClick={() => void controller.startDemo("normal")}>Try demo</button></div> : metric === "temperature" ? (
        <div className="detail-body">
          <div className="detail-value-block"><span>Current</span><strong>{temperatureText(temperature)}<small> °C</small></strong><span className="detail-sub">{temperature === null ? "DHT22 fault · value not trusted" : `${state.isStale ? "Last received" : "Alert above"} ${state.thresholdC.toFixed(1)} °C`}</span></div>
          <div className="detail-chart"><div className="section-heading"><div><h3>Recent temperature</h3><p>Last {state.samples.length} readings</p></div></div><TrendChart samples={state.samples} thresholdC={state.thresholdC} /></div>
          <div className="stat-pair"><div><span>Recent low</span><strong>{tempValues.length ? `${Math.min(...tempValues).toFixed(1)} °C` : "—"}</strong></div><div><span>Recent high</span><strong>{tempValues.length ? `${Math.max(...tempValues).toFixed(1)} °C` : "—"}</strong></div></div>
          <p className="detail-rule">Warnings begin after 3 consecutive readings above threshold and at least 1.5 s.</p>
        </div>
      ) : metric === "humidity" ? (
        <div className="detail-body">
          <div className="detail-value-block"><span>Relative humidity</span><strong>{humidity === null ? "—" : humidity.toFixed(0)}<small>{humidity === null ? "" : " %RH"}</small></strong><span className="detail-sub">{humidity === null ? "DHT22 fault · value not trusted" : "Environmental measurement"}</span></div>
          <div className="detail-chart"><div className="section-heading"><div><h3>Recent humidity</h3><p>Last {state.samples.length} readings</p></div></div><TrendChart samples={state.samples} metric="humidity" /></div>
          <div className="stat-pair"><div><span>Recent low</span><strong>{humidityValues.length ? `${Math.min(...humidityValues).toFixed(0)} %` : "—"}</strong></div><div><span>Recent high</span><strong>{humidityValues.length ? `${Math.max(...humidityValues).toFixed(0)} %` : "—"}</strong></div></div>
          <p className="detail-rule">Humidity is shown as measured. This prototype does not infer product quality from humidity alone.</p>
        </div>
      ) : (
        <div className="detail-body air-detail">
          <div className={`air-readiness ${readiness ?? "quiet"}`}><span>ENS160 status</span><strong>{readiness === "ready" ? "Ready" : readiness === "warming" ? "Warming" : readiness === "starting" ? "Initial start-up" : "Fault / no data"}</strong></div>
          <div className="detail-chart"><div className="section-heading"><div><h3>TVOC trend</h3><p>Equivalent air-quality outputs</p></div></div><TrendChart samples={state.samples} metric="tvoc" /></div>
          <div className="air-stat-list">
            <div><span>AQI · UBA scale</span><strong>{readiness === "ready" ? `${sample?.aqi || "—"} / 5` : "—"}</strong></div>
            <div><span>TVOC</span><strong>{readiness === "ready" ? `${sample?.tvoc} ppb` : "—"}</strong></div>
            <div><span>eCO₂ estimate</span><strong>{readiness === "ready" ? `${sample?.eco2} ppm eq.` : "—"}</strong></div>
            <div><span>MQ-135 relative ADC</span><strong>{sample?.mq135Raw ?? "—"}</strong></div>
          </div>
          <p className="detail-rule">eCO₂ is an estimate, not a direct CO₂ measurement. MQ-135 indicates a broad relative response and does not identify a gas.</p>
        </div>
      )}
    </AccessibleDialog>
  );
}

export function EventDetail({ state, controller, eventId }: { state: AppState; controller: AppController; eventId: string }) {
  const event = state.events.find((item) => item.id === eventId);
  if (!event) return <AccessibleDialog className="detail-view" controller={controller} labelledBy="event-unavailable-heading"><div className="detail-header"><button className="icon-button" onClick={() => controller.back()} aria-label="Back"><Icon name="back" /></button><h2 id="event-unavailable-heading" tabIndex={-1}>Event unavailable</h2></div><div className="empty-panel"><p>This event is no longer in local history.</p></div></AccessibleDialog>;
  const statusTone = event.status === "active" ? "warning" : event.status === "recovered" ? "normal" : "quiet";
  return (
    <AccessibleDialog className="detail-view" controller={controller} labelledBy="event-detail-heading">
      <div className="detail-header"><button className="icon-button back-button" onClick={() => controller.back()} aria-label="Back"><Icon name="back" /></button><div><span className="section-label">EVENT DETAIL</span><h2 id="event-detail-heading" tabIndex={-1}>{event.title}</h2></div><button className="icon-button" onClick={() => controller.back()} aria-label="Close detail"><Icon name="close" /></button></div>
      <div className="detail-body event-detail-body">
        <span className={`condition-badge ${statusTone}`}>{event.status === "active" ? "Active" : event.status === "recovered" ? "Recovered" : "Interrupted"}</span>
        <div className="event-measure"><span>{event.metric === "temperature" ? "Peak temperature" : event.airTriggerBasis === "aqi" ? "Peak AQI" : event.airTriggerBasis === "unknown" ? "Air reading" : "Peak air readings"}</span><strong>{eventPeak(event)}</strong></div>
        <div className="event-facts"><div><span>Started</span><strong>{timeLabel(event.startedAt)}</strong></div><div><span>Duration</span><strong>{durationLabel(event.startedAt, event.endedAt)}</strong></div><div><span>Threshold</span><strong>{eventThreshold(event)}</strong></div></div>
        <div className="event-facts"><div><span>Source</span><strong>{event.source === "demo" ? "Simulated" : "BLE sensor"}</strong></div><div><span>End state</span><strong>{event.status === "active" ? "Condition remains above threshold" : event.status === "recovered" ? "Returned below recovery limit" : "Monitoring stopped before recovery"}</strong></div></div>
        <div className="event-explanation"><Icon name="info" size={18} /><p>{event.metric === "temperature" ? "Recorded after 3 consecutive readings exceeded the configured threshold for at least 1.5 s." : "Recorded after repeated ENS160 air-quality readings crossed a watch threshold. No specific gas or cause is inferred."}</p></div>
      </div>
    </AccessibleDialog>
  );
}

export function ForecastEventDetail({ state, controller, eventId }: { state: AppState; controller: AppController; eventId: string }) {
  const event = state.forecastEvents.find((item) => item.id === eventId);
  if (!event) return <AccessibleDialog className="detail-view" controller={controller} labelledBy="forecast-unavailable-heading"><div className="detail-header"><button className="icon-button" onClick={() => controller.back()} aria-label="Back"><Icon name="back" /></button><h2 id="forecast-unavailable-heading" tabIndex={-1}>Event unavailable</h2></div><div className="empty-panel"><p>This forecast event is no longer in local history.</p></div></AccessibleDialog>;
  const evaluation = event.modelRole === "s2-heldout-evaluation";
  const statusTone = event.status === "active" ? "warning" : event.status === "recovered" ? "normal" : "quiet";
  const title = event.peakRawScore >= event.threshold ? "Model alert" : "Forecast event";
  const sourceLabel = evaluation ? "S2 held-out evaluation replay" : event.sourceSessionId.startsWith("edge3-ble") ? "EDGE-3 BLE node" : "S3 production replay";
  return <AccessibleDialog className="detail-view" controller={controller} labelledBy="forecast-detail-heading">
    <div className="detail-header"><button className="icon-button back-button" onClick={() => controller.back()} aria-label="Back to history"><Icon name="back" /></button><div><span className="section-label">THERMAL MODEL EVENT</span><h2 id="forecast-detail-heading" tabIndex={-1}>{title}</h2></div><button className="icon-button" onClick={() => controller.back()} aria-label="Close detail"><Icon name="close" /></button></div>
    <div className="detail-body event-detail-body">
      <span className={`condition-badge ${statusTone}`}>{statusLabel(event.status)}</span>
      <div className="forecast-detail-score"><span>Peak raw model score</span><strong>{event.peakRawScore.toFixed(3)}</strong><small>Alert threshold · {event.threshold.toFixed(2)}</small></div>
      <div className="event-facts"><div><span>Started</span><strong>{timeLabel(event.startedAt)}</strong></div><div><span>Duration</span><strong>{durationLabel(event.startedAt, event.endedAt)}</strong></div><div><span>Source</span><strong>{sourceLabel}</strong></div><div><span>Model</span><strong>{event.modelVersion}</strong></div><div><span>Role</span><strong>{evaluation ? "Evaluation only" : "Production model"}</strong></div><div><span>End state</span><strong>{event.status === "active" ? "Monitoring is still above threshold" : event.status === "recovered" ? "Next valid score fell below threshold" : "Monitoring ended before recovery was observed"}</strong></div></div>
      <div className="event-explanation"><Icon name="info" size={18} /><p>{evaluation ? "This is a held-out S2 evaluation replay, not a deployment result." : "The score is an uncalibrated model output. It is not a probability, food-safety determination, shelf-life estimate or root-cause diagnosis."}</p></div>
    </div>
  </AccessibleDialog>;
}
