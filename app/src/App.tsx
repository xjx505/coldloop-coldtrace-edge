import { useEffect, useState, useSyncExternalStore } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { AppController, type MainScreen, type AppState } from "./state/AppController";
import { DEMO_SCENARIOS, type DemoScenario } from "./transport/MockTransport";
import { Icon } from "./components/Icon";
import { DeviceScreen, EventDetail, ForecastEventDetail, HistoryScreen, LiveScreen, MetricDetail, SettingsScreen } from "./screens/ProductScreens";

function statusCopy(status: string, replayComplete = false): string {
  if (replayComplete) return "Replay complete";
  switch (status) {
    case "connected": return "Connected";
    case "scanning": return "Scanning";
    case "connecting": return "Connecting";
    case "reconnecting": return "Reconnecting";
    case "error": return "Action needed";
    default: return "Not connected";
  }
}

function statusTone(status: string): string {
  if (status === "connected") return "connected";
  if (status === "error") return "warning";
  if (status === "scanning" || status === "connecting" || status === "reconnecting") return "working";
  return "offline";
}

function Navigation({ screen, returnScreen, onNavigate, inert = false }: { screen: MainScreen; returnScreen: MainScreen; onNavigate: (screen: MainScreen) => void; inert?: boolean }) {
  const active = screen === "settings" ? returnScreen : screen;
  const items: { id: MainScreen; label: string; icon: "live" | "history" | "device" }[] = [
    { id: "live", label: "Live", icon: "live" },
    { id: "history", label: "History", icon: "history" },
    { id: "device", label: "Device", icon: "device" },
  ];
  return <nav className="bottom-nav" aria-label="Main navigation" inert={inert}>
    {items.map((item) => <button className={active === item.id ? "nav-item selected" : "nav-item"} key={item.id} onClick={() => onNavigate(item.id)} aria-current={active === item.id ? "page" : undefined}>
      <Icon name={item.icon} size={20} /><span>{item.label}</span>
    </button>)}
  </nav>;
}

function ProductApp({ controller, embedded = false }: { controller: AppController; embedded?: boolean }) {
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const AppHeader = embedded ? "div" : "header";
  const AppMain = embedded ? "div" : "main";
  const hasOverlay = Boolean(state.overlay);
  return <div className="app-shell" data-app="coldloop">
    <a className="skip-link" href="#main-content" inert={hasOverlay}>Skip to content</a>
    <AppHeader className="app-header" role={embedded ? "group" : undefined} aria-label={embedded ? `${state.sourceSession?.profile === "edge3-15byte" ? "ColdTrace Edge" : "ColdLoop"} app header` : undefined} inert={hasOverlay}>
      {state.screen === "settings" ? <>
        <button className="icon-button header-back" onClick={() => controller.back()} aria-label="Back"><Icon name="back" /></button>
        <div className="header-title"><span className="section-label">PREFERENCES</span><h1>Settings</h1></div>
      </> : <>
        <div className="header-title"><span className="section-label">{state.sourceSession?.profile === "edge3-15byte" ? "THERMAL FORECAST" : "CONDITION MONITORING"}</span><h1>{state.sourceSession?.profile === "edge3-15byte" ? "ColdTrace Edge" : "ColdLoop"}</h1></div>
        <div className="header-actions">
          <span className={`header-status ${statusTone(state.connection)}`} role="status"><i aria-hidden="true" />{statusCopy(state.connection, state.replayComplete)}</span>
          <button className="icon-button" onClick={() => controller.navigate("settings")} aria-label="Open settings"><Icon name="settings" /></button>
        </div>
      </>}
    </AppHeader>

    <AppMain id="main-content" className="app-main" key={state.screen} tabIndex={-1} role={embedded ? "region" : undefined} aria-label={embedded ? "Product screens" : undefined} inert={hasOverlay}>
      {state.screen === "live" && <LiveScreen state={state} controller={controller} />}
      {state.screen === "history" && <HistoryScreen state={state} controller={controller} />}
      {state.screen === "device" && <DeviceScreen state={state} controller={controller} />}
      {state.screen === "settings" && <SettingsScreen state={state} controller={controller} />}
    </AppMain>

    <Navigation screen={state.screen} returnScreen={state.previousScreen} onNavigate={(screen) => controller.navigate(screen)} inert={hasOverlay} />

    {state.overlay?.type === "metric" && <MetricDetail state={state} controller={controller} metric={state.overlay.metric} />}
    {state.overlay?.type === "event" && <EventDetail state={state} controller={controller} eventId={state.overlay.eventId} />}
    {state.overlay?.type === "forecast-event" && <ForecastEventDetail state={state} controller={controller} eventId={state.overlay.eventId} />}
  </div>;
}

function ShowcaseControls({ controller, state, inert = false }: { controller: AppController; state: AppState; inert?: boolean }) {
  const scenario = state.scenario;
  const isDemo = state.sourceSession?.mode === "condition-simulation";
  const isReplay = state.sourceSession?.mode === "production-replay" || state.sourceSession?.mode === "evaluation-replay";
  const advancedScenarios = DEMO_SCENARIOS.filter((item) => !["normal", "temperature-rising", "recovery"].includes(item.id));
  const [advancedScenario, setAdvancedScenario] = useState<DemoScenario>("temperature-warning");
  const mainScenarios = [
    { id: "normal", label: "Normal" },
    { id: "temperature-rising", label: "Excursion" },
    { id: "recovery", label: "Recovery" },
  ] as const;
  return <aside className="showcase-controls" aria-label="Presenter controls" inert={inert}>
    <span className="section-label">PRESENTER CONTROLS</span>
    <h2>Show the condition journey</h2>
    <p>Choose a state to update the shared product screen.</p>
    <div className="showcase-scenarios">
      {mainScenarios.map((item) => <button className={scenario === item.id ? "scenario-button active" : "scenario-button"} key={item.id} onClick={() => { controller.navigate("live"); void controller.startDemo(item.id); }} data-scenario={item.id} aria-pressed={scenario === item.id}>{item.label}</button>)}
    </div>
    <button className="showcase-disconnect" onClick={() => isReplay ? void controller.stopReplay() : void controller.stopDemo()} disabled={!isDemo && !isReplay}><Icon name="link" size={16} />{isReplay ? "Stop replay" : "Stop simulation"}</button>
    <section className="showcase-ai" aria-label="Predictive AI demonstration">
      <span className="section-label">PREDICTIVE AI</span>
      <button className="scenario-button replay-button" onClick={() => { controller.navigate("live"); void controller.startProductionReplay(); }} data-scenario="production-replay">Run shipment replay</button>
      <p>Recorded S3 telemetry · on-device inference</p>
      <details className="showcase-advanced evaluation-controls">
        <summary>Held-out evaluation</summary>
        <p>S2 replay is evaluation evidence only.</p>
        <button className="scenario-button" onClick={() => { controller.navigate("live"); void controller.startS2EvaluationReplay(); }} data-scenario="evaluation-replay">Run S2 evaluation</button>
      </details>
    </section>
    <details className="showcase-advanced">
      <summary>Simulation checks</summary>
      <label className="visually-hidden" htmlFor="showcase-advanced-scenario">Advanced scenario</label>
      <select id="showcase-advanced-scenario" value={advancedScenario} onChange={(event) => setAdvancedScenario(event.currentTarget.value as DemoScenario)}>
        {advancedScenarios.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <button className="scenario-button" onClick={() => { controller.navigate("live"); void controller.startDemo(advancedScenario); }}>Run scenario</button>
    </details>
  </aside>;
}

export default function App() {
  const [controller] = useState(() => new AppController());
  const showcase = window.location.pathname === "/showcase";

  useEffect(() => {
    controller.start(showcase);
    let disposed = false;
    const handles: { remove: () => Promise<void> }[] = [];
    if (Capacitor.isNativePlatform()) {
      void CapacitorApp.addListener("backButton", () => {
        if (!controller.back()) void CapacitorApp.exitApp();
      }).then((handle) => { if (disposed) void handle.remove(); else handles.push(handle); });
      void CapacitorApp.addListener("appStateChange", ({ isActive }) => controller.setAppActive(isActive))
        .then((handle) => { if (disposed) void handle.remove(); else handles.push(handle); });
    }
    return () => {
      disposed = true;
      handles.forEach((handle) => void handle.remove());
      void controller.dispose();
    };
  }, [controller, showcase]);

  const stateForShowcase = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const product = <ProductApp controller={controller} embedded={showcase} />;
  if (!showcase) return product;

  return <div className="showcase-page">
    <header className="showcase-header" inert={Boolean(stateForShowcase.overlay)}><div><span className="section-label">COLDLOOP · PRODUCT SHOWCASE</span><h1>Cold-chain conditions, at a glance.</h1></div><span className="showcase-live-tag">Shared Android + web UI</span></header>
    <main className="showcase-layout">
      <div className="showcase-device-wrap"><div className="showcase-device-label">LIVE PRODUCT UI · PHONE VIEW</div><div className="showcase-device">{product}</div></div>
      <ShowcaseControls controller={controller} state={stateForShowcase} inert={Boolean(stateForShowcase.overlay)} />
    </main>
  </div>;
}
