import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoDir = path.resolve(appDir, "..");
const adbPath = path.join(process.env.LOCALAPPDATA ?? "", "Android", "Sdk", "platform-tools", "adb.exe");
const apkPath = path.join(appDir, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const outputDir = path.join(repoDir, "qa", "screenshots", "android");
const reportPath = path.join(repoDir, "qa", "reports", "android-journey.json");
const serial = "emulator-5554";
const packageId = "com.coldloop.monitor";
const debugPort = 9236;
const screenshots = [];
const steps = [];
const runtimeExceptions = [];
const networkRequests = new Set();
let previousConnectivity;
let activeCdp;

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

async function adb(...args) {
  const { stdout } = await execFileAsync(adbPath, ["-s", serial, ...args], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
  return stdout.trim();
}

async function appPid() {
  // pidof exits with code 1 between ActivityManager launch/stop transitions.
  // Surface that normal transient state as an empty result for waitUntil.
  return (await adb("shell", "pidof", packageId).catch(() => "")).split(/\s+/)[0] ?? "";
}

async function waitUntil(predicate, message, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await predicate();
    if (last) return last;
    await delay(250);
  }
  throw new Error(`${message} (last=${JSON.stringify(last)})`);
}

class PageDebugger {
  constructor(webSocketUrl) {
    this.socket = new WebSocket(webSocketUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.closed = false;
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.method === "Runtime.exceptionThrown") {
        runtimeExceptions.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
      }
      if (message.method === "Network.requestWillBeSent") networkRequests.add(message.params.request.url);
      if (message.id === undefined) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
    this.socket.addEventListener("close", () => {
      for (const pending of this.pending.values()) pending.reject(new Error("WebView DevTools connection closed"));
      this.pending.clear();
    });
    await this.send("Runtime.enable");
    await this.send("Network.enable");
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`WebView DevTools command timed out: ${method}`));
      }, 10_000);
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timeoutId); resolve(value); },
        reject: (error) => { clearTimeout(timeoutId); reject(error); },
      });
      try { this.socket.send(JSON.stringify({ id, method, params })); }
      catch (error) { clearTimeout(timeoutId); this.pending.delete(id); reject(error); }
    });
  }

  async evaluate(expression) {
    const response = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    }
    return response.result?.value ?? null;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.socket.close();
  }
}

async function connectWebView() {
  const pid = await waitUntil(appPid, "ColdLoop process is not running");
  ensure(pid, "ColdLoop Android process is not running");
  await adb("forward", `tcp:${debugPort}`, `localabstract:webview_devtools_remote_${pid}`);
  const target = await waitUntil(async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json`);
      if (!response.ok) return null;
      const targets = await response.json();
      return targets.find((item) => item.type === "page" && item.title.startsWith("ColdLoop")) ?? null;
    } catch {
      return null;
    }
  }, "ColdLoop WebView DevTools target did not appear");
  const cdp = new PageDebugger(target.webSocketDebuggerUrl);
  activeCdp = cdp;
  await cdp.connect();
  await waitUntil(() => cdp.evaluate("document.querySelector('[data-app]')?.getAttribute('data-app') === 'coldloop'"), "ColdLoop UI did not mount");
  return { cdp, target, pid };
}

async function click(cdp, selector) {
  const result = await cdp.evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return false; element.click(); return true; })()`);
  ensure(result === true, `No element matched ${selector}`);
}

async function waitForSelector(cdp, selector, message = selector, timeoutMs = 12_000) {
  await waitUntil(() => cdp.evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`), message, timeoutMs);
}

async function waitForText(cdp, text, timeoutMs = 12_000) {
  const needle = JSON.stringify(text);
  await waitUntil(() => cdp.evaluate(`document.body.innerText.includes(${needle})`), `Visible text did not include ${text}`, timeoutMs);
}

async function waitForResumedActivity() {
  await waitUntil(async () => {
    const activity = await adb("shell", "dumpsys", "activity", "activities");
    return activity.includes("topResumedActivity=") && activity.includes(`${packageId}/.MainActivity`);
  }, "ColdLoop Android activity is not resumed", 15_000);
}

async function selectScenario(cdp, scenario) {
  const selected = await cdp.evaluate(`(() => {
    const details = document.querySelector('.advanced-scenarios');
    if (details) details.open = true;
    const element = document.querySelector('#demo-scenario');
    if (!element) return null;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(element, ${JSON.stringify(scenario)});
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return element.value;
  })()`);
  ensure(selected === scenario, `Could not select demo scenario ${scenario}`);
}

async function runScenario(cdp, scenario) {
  await click(cdp, '.app-header button[aria-label="Open settings"]');
  await waitForSelector(cdp, '[data-screen="settings"]', "Settings screen did not open");
  await selectScenario(cdp, scenario);
  await click(cdp, '.scenario-run');
  await click(cdp, '.bottom-nav .nav-item:first-child');
  await waitForSelector(cdp, '[data-screen="live"]', "Live screen did not open");
  steps.push(`Scenario ${scenario}`);
}

async function runCoreScenario(cdp, scenario) {
  await click(cdp, '.app-header button[aria-label="Open settings"]');
  await waitForSelector(cdp, '[data-screen="settings"]', "Settings screen did not open");
  await click(cdp, `[data-setting-scenario="${scenario}"]`);
  await click(cdp, '.bottom-nav .nav-item:first-child');
  await waitForSelector(cdp, '[data-screen="live"]', "Live screen did not open");
  steps.push(`Core simulation state ${scenario}`);
}

async function capture(cdp, label) {
  await cdp.evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  await delay(750);
  const devicePath = `/sdcard/coldloop-${label}.png`;
  const localPath = path.join(outputDir, `${label}.png`);
  await adb("shell", "screencap", "-p", devicePath);
  let pullError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await unlink(localPath).catch(() => undefined);
      await adb("pull", devicePath, localPath);
      const image = await stat(localPath);
      ensure(image.size > 8, `Android screenshot ${label} was empty`);
      pullError = undefined;
      break;
    } catch (error) {
      pullError = error;
      await delay(attempt * 250);
    }
  }
  if (pullError) throw new Error(`Could not pull Android screenshot ${label} after three attempts: ${pullError.message}`);
  screenshots.push(path.relative(repoDir, localPath).replaceAll("\\", "/"));
  steps.push(`Screenshot ${label}: ColdLoop Android surface`);
  // Reattach after Android screenshot I/O. Some emulator WebViews stop replying
  // to an existing DevTools socket even though the rendered app remains healthy.
  cdp.close();
  await adb("forward", "--remove", `tcp:${debugPort}`).catch(() => undefined);
  await delay(100);
  return connectWebView();
}

async function tapTryDemo(cdp, target) {
  const rect = await cdp.evaluate(`(() => {
    const element = [...document.querySelectorAll('.empty-actions button')].find((item) => item.textContent.trim() === 'Try demo');
    if (!element) return null;
    const r = element.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, dpr: devicePixelRatio };
  })()`);
  ensure(rect, "Try demo button is missing on cold launch");
  const surface = JSON.parse(target.description);
  const screenX = Math.round(surface.screenX + rect.x * rect.dpr);
  const screenY = Math.round(surface.screenY + rect.y * rect.dpr);
  await adb("shell", "input", "tap", String(screenX), String(screenY));
  await waitUntil(() => cdp.evaluate(`(() => {
    const status = document.querySelector('.header-status')?.textContent?.trim();
    const link = document.querySelector('.node-label div span')?.textContent?.trim();
    const source = document.querySelector('.source-tag')?.textContent?.trim();
    const temperature = Number(document.querySelector('.temperature-value strong')?.textContent?.trim());
    return status === 'Connected' && link === 'Connected' && source === 'Simulated data' && temperature >= 4.5 && temperature <= 5.1;
  })()`), "Touch did not start the deterministic demo and render a reading", 8_000);
  await delay(500);
  steps.push(`Android touch at ${screenX},${screenY} activated Try demo`);
}

async function setThreshold(cdp, value) {
  const changed = await cdp.evaluate(`(() => {
    const element = document.querySelector('input[type="range"]');
    if (!element) return null;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, ${JSON.stringify(String(value))});
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return element.value;
  })()`);
  ensure(changed === String(value), `Threshold did not change to ${value}; got ${changed}`);
  await waitForText(cdp, `${Number(value).toFixed(1)} °C`);
}

async function takeLogs() {
  const log = await adb("logcat", "-d", "-s", "AndroidRuntime:E", "CapacitorConsole:E");
  const file = path.join(outputDir, "android-runtime-errors.txt");
  await writeFile(file, `${log}\n`, "utf8");
  return { file: path.relative(repoDir, file).replaceAll("\\", "/"), hasFatalException: /FATAL EXCEPTION/.test(log) };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  previousConnectivity = {
    wifi: await adb("shell", "settings", "get", "global", "wifi_on").catch(() => "1"),
    mobileData: await adb("shell", "settings", "get", "global", "mobile_data").catch(() => "1"),
  };
  await adb("forward", "--remove", `tcp:${debugPort}`).catch(() => undefined);
  await execFileAsync(adbPath, ["devices", "-l"], { encoding: "utf8", windowsHide: true });
  await adb("install", "-r", apkPath);
  await adb("shell", "am", "force-stop", packageId).catch(() => undefined);
  await adb("logcat", "-c");
  await adb("shell", "pm", "clear", packageId);
  await adb("shell", "monkey", "-p", packageId, "1");
  await waitUntil(appPid, "ColdLoop process did not start", 20_000);
  await waitForResumedActivity();

  let { cdp, target, pid } = await connectWebView();
  await waitForSelector(cdp, '[data-screen="live"]', "Cold launch did not show Live");
  ensure(!(await cdp.evaluate('document.querySelector(".source-tag")')), "Disconnected/no-data cold launch must not imply a sensor source is ready");
  // DOM availability precedes the first composited WebView frame on a cold launch.
  await delay(1_500);
  ({ cdp, target, pid } = await capture(cdp, "01-cold-launch"));

  await click(cdp, ".bottom-nav .nav-item:nth-child(2)");
  await waitForSelector(cdp, '[data-screen="history"]', "Empty History screen did not open");
  await waitForText(cdp, "No events yet");
  ({ cdp, target, pid } = await capture(cdp, "01b-empty-history"));
  await adb("shell", "input", "keyevent", "4");
  await waitForSelector(cdp, '[data-screen="live"]', "Android Back did not return from empty History to Live");
  steps.push("Android Back returned empty History to Live");

  await tapTryDemo(cdp, target);
  ({ cdp, target, pid } = await capture(cdp, "02-live-normal"));

  await click(cdp, ".temperature-feature");
  await waitForSelector(cdp, '[role="dialog"][aria-labelledby="metric-detail-heading"]', "Temperature detail did not open");
  ({ cdp, target, pid } = await capture(cdp, "03-temperature-detail"));
  await adb("shell", "input", "keyevent", "4");
  await waitUntil(() => cdp.evaluate(`document.querySelector('[role="dialog"]') === null`), "Android Back did not close metric detail");
  steps.push("Android Back closed temperature detail");

  await runCoreScenario(cdp, "temperature-rising");
  await waitUntil(() => cdp.evaluate(`Number(document.querySelector('.temperature-value strong')?.textContent) >= 6.5`), "Temperature excursion did not rise", 6_000);
  ({ cdp, target, pid } = await capture(cdp, "03b-temperature-rising"));
  await waitForSelector(cdp, ".warning-banner", "Temperature warning did not trigger", 12_000);
  ({ cdp, target, pid } = await capture(cdp, "04-temperature-warning"));
  await click(cdp, ".warning-banner");
  await waitForSelector(cdp, '[role="dialog"][aria-labelledby="event-detail-heading"]', "Warning event detail did not open");
  ({ cdp, target, pid } = await capture(cdp, "05-active-event-detail"));
  await adb("shell", "input", "keyevent", "4");
  await waitUntil(() => cdp.evaluate(`document.querySelector('[role="dialog"]') === null`), "Android Back did not close event detail");
  await click(cdp, ".bottom-nav .nav-item:nth-child(2)");
  await waitUntil(() => cdp.evaluate(`(() => {
    const rows = [...document.querySelectorAll('.event-row')];
    return rows.length === 1 && rows[0].querySelector('.event-state.state-active') !== null && rows[0].innerText.includes('Simulated');
  })()`), "History did not record exactly one active simulated warning");
  ({ cdp, target, pid } = await capture(cdp, "06-active-history"));
  await click(cdp, ".event-row[data-event-id]");
  await waitForSelector(cdp, '[role="dialog"][aria-labelledby="event-detail-heading"]', "History event detail did not open");
  ({ cdp, target, pid } = await capture(cdp, "07-history-event-detail"));
  await adb("shell", "input", "keyevent", "4");
  await waitUntil(() => cdp.evaluate(`document.querySelector('[role="dialog"]') === null`), "Android Back did not return to History");
  await runCoreScenario(cdp, "recovery");
  await waitForText(cdp, "Last event recovered", 8_000);
  ({ cdp, target, pid } = await capture(cdp, "08-recovered-live"));
  await click(cdp, ".bottom-nav .nav-item:nth-child(2)");
  await waitUntil(() => cdp.evaluate(`(() => {
    const rows = [...document.querySelectorAll('.event-row')];
    return rows.length === 1 && rows[0].querySelector('.event-state.state-recovered') !== null;
  })()`), "History did not keep exactly one recovered event");
  ({ cdp, target, pid } = await capture(cdp, "09-recovered-history"));

  await click(cdp, '.app-header button[aria-label="Open settings"]');
  await click(cdp, ".stop-demo");
  await click(cdp, ".bottom-nav .nav-item:first-child");
  await waitForSelector(cdp, '[data-screen="live"]', "Live did not return after stopping simulation");
  await waitForText(cdp, "Connect a sensor node");
  ensure(!(await cdp.evaluate('document.querySelector(".source-tag")')), "Stopping simulation left a synthetic source label");
  ({ cdp, target, pid } = await capture(cdp, "09b-simulation-stopped"));
  await click(cdp, ".bottom-nav .nav-item:nth-child(2)");
  await waitUntil(() => cdp.evaluate(`document.querySelectorAll('.event-row').length === 1 && document.querySelector('.event-state.state-recovered') !== null`), "Completed History did not survive stopping simulation");
  ({ cdp, target, pid } = await capture(cdp, "09c-stopped-history"));
  await adb("shell", "input", "keyevent", "4");
  await waitForSelector(cdp, '[data-screen="live"]', "Android Back did not return from History to Live");
  steps.push("Android Back returned History to Live without exiting the app");

  await click(cdp, ".bottom-nav .nav-item:nth-child(3)");
  await waitForSelector(cdp, '[data-screen="device"]', "Device screen did not open");
  ({ cdp, target, pid } = await capture(cdp, "10-device-health"));

  await runScenario(cdp, "ens-warming");
  await click(cdp, ".bottom-nav .nav-item:nth-child(3)");
  await waitForText(cdp, "Warming");
  ({ cdp, target, pid } = await capture(cdp, "11-ens-warming-health"));

  await runScenario(cdp, "dht-fault");
  await click(cdp, ".bottom-nav .nav-item:nth-child(3)");
  await waitForText(cdp, "Fault");
  ({ cdp, target, pid } = await capture(cdp, "12-dht-fault-health"));

  await runScenario(cdp, "no-device");
  await waitForText(cdp, "No ColdLoop node found");
  ({ cdp, target, pid } = await capture(cdp, "13-no-device-error"));

  await runScenario(cdp, "permission-denied");
  await waitForText(cdp, "Nearby devices permission needed");
  ({ cdp, target, pid } = await capture(cdp, "14-permission-error"));

  await runScenario(cdp, "stale");
  await waitForText(cdp, "Not live · showing the last reading", 9_000);
  ({ cdp, target, pid } = await capture(cdp, "15-stale-stream"));

  await runScenario(cdp, "malformed-packet");
  await waitForText(cdp, "Telemetry packet rejected");
  ({ cdp, target, pid } = await capture(cdp, "16-malformed-packet"));

  await click(cdp, '.app-header button[aria-label="Open settings"]');
  await waitForSelector(cdp, '[data-screen="settings"]', "Settings did not open");
  await setThreshold(cdp, 7.5);
  ({ cdp, target, pid } = await capture(cdp, "17-settings"));
  await adb("shell", "input", "keyevent", "4");
  await waitForSelector(cdp, '[data-screen="live"]', "Android Back did not leave Settings");

  await adb("shell", "input", "keyevent", "3");
  await delay(1_500);
  ensure(Boolean(await appPid()), "ColdLoop died while in the background");
  await adb("shell", "monkey", "-p", packageId, "1");
  await waitForResumedActivity();
  await waitForSelector(cdp, '[data-screen="live"]', "Foreground did not restore ColdLoop");
  await delay(4_000);
  ({ cdp, target, pid } = await capture(cdp, "18-foreground-resume"));
  steps.push("Home/background and launcher/foreground returned to the live screen");

  cdp.close();
  activeCdp = undefined;
  await adb("shell", "am", "force-stop", packageId);
  await waitUntil(async () => !(await appPid()), "ColdLoop process did not stop", 10_000);
  await adb("forward", "--remove", `tcp:${debugPort}`).catch(() => undefined);
  await adb("shell", "monkey", "-p", packageId, "1");
  await waitUntil(appPid, "ColdLoop did not restart", 20_000);
  await waitForResumedActivity();
  ({ cdp, target, pid } = await connectWebView());
  await waitForSelector(cdp, '[data-screen="live"]', "Restarted app did not show Live");
  // The WebView DOM is reachable before Android has painted the restored surface.
  // Allow the first resumed frame to reach SurfaceFlinger before recording evidence.
  await delay(1_500);
  ({ cdp, target, pid } = await capture(cdp, "19-cold-restart"));
  await click(cdp, '.app-header button[aria-label="Open settings"]');
  await waitForSelector(cdp, '[data-screen="settings"]', "Settings did not restore after restart");
  const persistedThreshold = await cdp.evaluate(`document.querySelector('input[type="range"]').value`);
  ensure(persistedThreshold === "7.5", `Settings did not persist after restart (got ${persistedThreshold})`);
  steps.push("Temperature threshold persisted across a native app restart");
  await click(cdp, ".bottom-nav .nav-item:nth-child(2)");
  await waitForSelector(cdp, '[data-screen="history"]', "History screen did not open after restart");
  await waitForSelector(cdp, ".event-row", "Event history did not survive native app restart");
  await delay(1_000);
  ({ cdp, target, pid } = await capture(cdp, "20-history-after-restart"));

  await adb("shell", "svc", "wifi", "disable");
  await adb("shell", "svc", "data", "disable").catch(() => undefined);
  steps.push("Disabled emulator network before the EDGE-3 local replay");
  await adb("shell", "input", "keyevent", "4");
  await waitForSelector(cdp, '[data-screen="live"]', "Android Back did not return from History before replay");
  await click(cdp, ".edge3-entry button:last-of-type");
  await waitForText(cdp, "Building history");
  ({ cdp, target, pid } = await capture(cdp, "21-coldtrace-s3-warming"));
  await waitForText(cdp, "Replay complete", 25_000);
  const firstOfflineScore = await cdp.evaluate("document.querySelector('.forecast-result strong')?.textContent?.trim() ?? null");
  ensure(firstOfflineScore === "0.13", `Offline Android S3 replay score mismatch: ${firstOfflineScore}`);
  ensure(await cdp.evaluate("document.querySelector('.forecast-outcome')?.textContent?.trim()") === "No model alert", "Normal offline Android S3 replay raised an unexpected model alert");
  ensure(await cdp.evaluate("document.querySelector('.temperature-feature') === null"), "EDGE-3 replay entered ColdLoop condition tiles on Android");
  ({ cdp, target, pid } = await capture(cdp, "22-coldtrace-s3-ready-offline"));
  steps.push("Offline Android replay reached the expected production score and no-alert state");

  await click(cdp, ".bottom-nav .nav-item:nth-child(3)");
  await waitForSelector(cdp, '[data-screen="device"]', "EDGE-3 Device screen did not open on Android");
  ensure(await cdp.evaluate("document.body.innerText.includes('EDGE-3 · 15-byte v1')"), "Android Device screen lost EDGE-3 profile details");
  ({ cdp, target, pid } = await capture(cdp, "23-coldtrace-device"));
  await adb("shell", "input", "keyevent", "4");
  await waitForSelector(cdp, '[data-screen="live"]', "Android Back did not return from EDGE-3 Device to Live");
  steps.push("Android Back returned from EDGE-3 Device to the forecast screen");

  cdp.close();
  activeCdp = undefined;
  await adb("shell", "am", "force-stop", packageId);
  await waitUntil(async () => !(await appPid()), "ColdLoop did not stop after the offline replay", 10_000);
  await adb("forward", "--remove", `tcp:${debugPort}`).catch(() => undefined);
  await adb("shell", "monkey", "-p", packageId, "1");
  await waitUntil(appPid, "ColdLoop did not cold-relaunch offline", 20_000);
  await waitForResumedActivity();
  ({ cdp, target, pid } = await connectWebView());
  await waitForSelector(cdp, '[data-screen="live"]', "Cold relaunch did not return to Live");
  ensure(await cdp.evaluate("document.querySelector('.edge3-live') === null"), "App resumed an old forecast window without reconnecting/replaying");
  await delay(1_000);
  ({ cdp, target, pid } = await capture(cdp, "24-coldtrace-cold-relaunch"));
  await click(cdp, ".edge3-entry button:last-of-type");
  await waitForText(cdp, "Building history");
  await waitForText(cdp, "Replay complete", 25_000);
  const restartedOfflineScore = await cdp.evaluate("document.querySelector('.forecast-result strong')?.textContent?.trim() ?? null");
  ensure(restartedOfflineScore === "0.13", `Offline Android replay after cold relaunch score mismatch: ${restartedOfflineScore}`);
  ensure(await cdp.evaluate("document.querySelector('.forecast-outcome')?.textContent?.trim()") === "No model alert", "Post-relaunch offline replay raised an unexpected model alert");
  ({ cdp, target, pid } = await capture(cdp, "25-coldtrace-offline-relaunch-ready"));
  steps.push("Kill/relaunch then repeat offline replay completed deterministically without a stored stale window");

  const externalRequests = [...networkRequests].filter((rawUrl) => {
    try { const host = new URL(rawUrl).hostname; return !["localhost", "127.0.0.1", "::1"].includes(host); }
    catch { return false; }
  });
  ensure(externalRequests.length === 0, `ColdTrace local inference made external requests: ${externalRequests.join(", ")}`);
  cdp.close();
  activeCdp = undefined;

  const logs = await takeLogs();
  ensure(!logs.hasFatalException, "Android logcat contains a fatal Java exception");
  ensure(runtimeExceptions.length === 0, `WebView runtime exceptions: ${runtimeExceptions.join(" | ")}`);
  return { screenshots, steps, runtimeExceptions, logs, networkRequests: [...networkRequests], externalRequests, appPidBeforeRestart: pid };
}

let status = "PASS";
let failure = null;
let result;
try {
  result = await main();
} catch (error) {
  status = "FAIL";
  failure = error instanceof Error ? error.stack ?? error.message : String(error);
} finally {
  activeCdp?.close();
  await execFileAsync(adbPath, ["-s", serial, "forward", "--remove", `tcp:${debugPort}`], { encoding: "utf8", windowsHide: true }).catch(() => undefined);
  if (previousConnectivity) {
    await execFileAsync(adbPath, ["-s", serial, "shell", "svc", "wifi", previousConnectivity.wifi === "1" ? "enable" : "disable"], { encoding: "utf8", windowsHide: true }).catch(() => undefined);
    await execFileAsync(adbPath, ["-s", serial, "shell", "svc", "data", previousConnectivity.mobileData === "1" ? "enable" : "disable"], { encoding: "utf8", windowsHide: true }).catch(() => undefined);
  }
}
const report = {
  generatedAt: new Date().toISOString(),
  serial,
  packageId,
  apkPath: path.relative(repoDir, apkPath).replaceAll("\\", "/"),
  status,
  screenshots: result?.screenshots ?? screenshots,
  steps: result?.steps ?? steps,
  runtimeExceptions: result?.runtimeExceptions ?? runtimeExceptions,
  ...(result ? { networkRequests: result.networkRequests, externalRequests: result.externalRequests } : {}),
  ...(result ? { logs: result.logs } : {}),
  ...(failure ? { failure } : {}),
};
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`Android journey: ${status}\nScreenshots: ${report.screenshots?.length ?? 0}\nReport: ${path.relative(repoDir, reportPath)}\n`);
if (status === "FAIL") {
  process.stderr.write(`${failure}\n`);
  process.exitCode = 1;
}
