import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoDir = path.resolve(appDir, "..");
const outputDir = path.join(repoDir, "qa", "screenshots", "web");
const reportPath = path.join(repoDir, "qa", "reports", "web-journey.json");
const baseUrl = "http://127.0.0.1:4174";
const viteCli = path.join(appDir, "node_modules", "vite", "bin", "vite.js");
const screenshots = [];
const viewportResults = [];
const failures = [];

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer(server) {
  const deadline = Date.now() + 45_000;
  let lastError;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Vite preview exited with ${server.exitCode}`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }
  throw new Error(`Vite preview did not become ready: ${lastError ?? "timeout"}`);
}

async function capture(page, label, dir) {
  // Wait for React's route update and the browser compositor before taking a
  // frame; immediate screenshots occasionally captured a partially painted
  // shell after switching from the long Settings screen.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await delay(100);
  const chrome = await page.locator(".app-shell").evaluate((shell) => {
    const header = shell.querySelector(".app-header").getBoundingClientRect();
    const nav = shell.querySelector(".bottom-nav").getBoundingClientRect();
    return { headerTop: header.top, headerBottom: header.bottom, navTop: nav.top, navBottom: nav.bottom, viewportHeight: window.innerHeight };
  });
  ensure(chrome.headerTop >= -1 && chrome.headerBottom <= chrome.viewportHeight + 1 && chrome.navTop >= -1 && chrome.navBottom <= chrome.viewportHeight + 1,
    `${label}: app header or bottom navigation is outside the viewport (${JSON.stringify(chrome)})`);
  const target = path.join(dir, `${label}.png`);
  await page.screenshot({ path: target, animations: "disabled" });
  screenshots.push(path.relative(repoDir, target).replaceAll("\\", "/"));
  return target;
}

async function selectAndRun(page, scenario) {
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.locator(".advanced-scenarios").evaluate((details) => { details.open = true; });
  await page.locator("#demo-scenario").selectOption(scenario);
  await page.getByRole("button", { name: "Run scenario", exact: true }).click();
}

async function selectCoreScenario(page, scenario) {
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.locator(`[data-setting-scenario="${scenario}"]`).click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Live" }).click();
}

async function assertPhoneLayout(page, width) {
  const result = await page.evaluate(() => {
    const targets = [...document.querySelectorAll(
      ".bottom-nav .nav-item, .empty-actions button, .icon-button, .temperature-feature, .metric-tile, .simulation-button, .scenario-run, .compact-button, .plain-action, .recent-event-line button, .text-action, .stale-banner button, .stop-demo, .history-setting .button-danger-outline",
    )].map((element) => {
      const rect = element.getBoundingClientRect();
      return { label: element.getAttribute("aria-label") ?? element.textContent?.trim() ?? element.tagName, width: rect.width, height: rect.height };
    });
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      targets,
    };
  });
  ensure(result.documentWidth <= width + 1, `${width}px page has horizontal overflow (${result.documentWidth}px)`);
  ensure(result.bodyWidth <= width + 1, `${width}px body has horizontal overflow (${result.bodyWidth}px)`);
  const small = result.targets.filter((target) => target.height < 44);
  ensure(small.length === 0, `${width}px interactive targets under 44px: ${JSON.stringify(small)}`);
  return result;
}

async function runPhoneJourney(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    if (location.origin !== "http://127.0.0.1:4174" || sessionStorage.getItem("coldloop-qa-reset")) return;
    localStorage.clear();
    sessionStorage.setItem("coldloop-qa-reset", "1");
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  const dir = path.join(outputDir, `${width}x${height}`);
  await mkdir(dir, { recursive: true });

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "ColdLoop" }).waitFor();
    ensure(await page.locator(".source-tag").count() === 0, `${width}px disconnected/no-data screen must not imply a sensor source is ready`);
    const layout = await assertPhoneLayout(page, width);
    await capture(page, "01-no-data", dir);

    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    await navigation.getByRole("button", { name: "History" }).click();
    await page.locator('[data-screen="history"]').waitFor();
    await page.getByText("No events yet").waitFor();
    await assertPhoneLayout(page, width);
    await capture(page, "01b-empty-history", dir);
    await navigation.getByRole("button", { name: "Live" }).click();
    await page.locator('[data-screen="live"]').waitFor();

    await page.getByRole("button", { name: "Try demo" }).click();
    await page.getByText("Connected", { exact: true }).first().waitFor();
    await page.getByText("Simulated data", { exact: true }).waitFor();
    await page.waitForFunction(() => {
      const value = Number(document.querySelector(".temperature-value strong")?.textContent);
      return value >= 4.5 && value <= 5.1;
    }, null, { timeout: 5_000 });
    ensure(await page.locator(".source-tag").count() === 1, `${width}px simulation must have one clear source label`);
    ensure(await page.locator(".warning-banner").count() === 0, `${width}px normal simulation must remain calm`);
    await assertPhoneLayout(page, width);
    await capture(page, "02-live-normal", dir);

    await page.getByRole("button", { name: /Open temperature details/ }).click();
    await page.getByRole("dialog", { name: "Temperature" }).waitFor();
    await capture(page, "03-temperature-detail", dir);
    await page.getByRole("button", { name: "Close detail" }).click();

    await selectCoreScenario(page, "temperature-rising");
    await page.waitForFunction(() => Number(document.querySelector(".temperature-value strong")?.textContent) >= 6.5, null, { timeout: 6_000 });
    await capture(page, "03b-temperature-rising", dir);
    await page.locator(".warning-banner").waitFor({ timeout: 12_000 });
    await assertPhoneLayout(page, width);
    await capture(page, "04-temperature-warning", dir);
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "History" }).click();
    ensure(await page.locator(".event-row").count() === 1, `${width}px excursion should create exactly one history event`);
    ensure(await page.locator(".event-state.state-active").count() === 1, `${width}px excursion event is not active in History`);
    await capture(page, "05-active-history", dir);
    await page.locator(".event-row[data-event-id]").first().click();
    await page.locator('[role="dialog"][aria-labelledby="event-detail-heading"]').waitFor();
    await page.getByRole("dialog").getByText("Simulated", { exact: true }).waitFor();
    await capture(page, "06-history-event-detail", dir);
    await page.getByRole("button", { name: "Close detail" }).click();

    await selectCoreScenario(page, "recovery");
    await page.getByText(/Last event recovered/).waitFor({ timeout: 8_000 });
    await capture(page, "07-recovered-live", dir);
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "History" }).click();
    ensure(await page.locator(".event-row").count() === 1, `${width}px recovery duplicated the excursion event`);
    await page.getByText("Recovered", { exact: true }).first().waitFor();
    await capture(page, "08-recovered-history", dir);

    await page.getByRole("button", { name: "Open settings" }).click();
    await page.getByRole("button", { name: "Stop simulation" }).click();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Live" }).click();
    ensure(await page.locator(".source-tag").count() === 0, `${width}px stopping simulation left a misleading source label`);
    await page.getByText("Connect a sensor node").waitFor();
    await capture(page, "09-simulation-stopped", dir);
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "History" }).click();
    ensure(await page.locator(".event-row").count() === 1, `${width}px stopping simulation cleared local event history`);
    await page.getByText("Recovered", { exact: true }).first().waitFor();
    await capture(page, "09b-stopped-history", dir);

    await page.getByRole("button", { name: "Device" }).click();
    await page.locator('[data-screen="device"]').waitFor();
    await capture(page, "10-device-health", dir);
    await page.getByRole("button", { name: "Open settings" }).click();
    await page.locator('[data-screen="settings"]').waitFor();
    await capture(page, "11-settings", dir);

    const threshold = page.getByLabel("Temperature alert threshold in degrees Celsius");
    await threshold.focus();
    await threshold.press("ArrowLeft");
    const configuredThreshold = await threshold.inputValue();
    ensure(configuredThreshold === "7.5", `${width}px threshold did not change to 7.5 (got ${configuredThreshold})`);

    await page.locator(".advanced-scenarios").evaluate((details) => { details.open = true; });
    await page.locator("#demo-scenario").selectOption("ens-warming");
    await page.getByRole("button", { name: "Run scenario", exact: true }).click();
    await page.getByRole("button", { name: "Device" }).click();
    await page.getByText("Warming", { exact: true }).waitFor();
    await capture(page, "12-ens-warming-health", dir);

    await selectAndRun(page, "dht-fault");
    await page.getByRole("button", { name: "Device" }).click();
    await page.getByText("Fault", { exact: true }).waitFor();
    await capture(page, "13-dht-fault-health", dir);

    await selectAndRun(page, "no-device");
    await page.getByRole("button", { name: "Live" }).click();
    await page.getByText("No ColdLoop node found").waitFor();
    await capture(page, "14-no-device-error", dir);

    await selectAndRun(page, "permission-denied");
    await page.getByRole("button", { name: "Live" }).click();
    await page.getByText("Nearby devices permission needed").waitFor();
    await capture(page, "15-permission-error", dir);

    await selectAndRun(page, "stale");
    await page.getByRole("button", { name: "Live" }).click();
    await page.getByText("Not live · showing the last reading", { exact: false }).waitFor({ timeout: 9_000 });
    await capture(page, "16-stale-stream", dir);

    await selectAndRun(page, "malformed-packet");
    await page.getByRole("button", { name: "Live" }).click();
    await page.getByText("Telemetry packet rejected").waitFor();
    await capture(page, "17-malformed-packet", dir);

    await selectAndRun(page, "ens-fault");
    await page.getByRole("button", { name: "Device" }).click();
    await page.getByText("Fault", { exact: true }).waitFor();
    await capture(page, "18-ens-fault-health", dir);

    await selectAndRun(page, "air-voc-excursion");
    await page.getByRole("button", { name: "Live" }).click();
    await page.locator(".warning-banner").waitFor({ timeout: 8_000 });
    await capture(page, "19-air-voc-warning", dir);

    for (const [scenario, message, screenshot] of [
      ["bluetooth-off", "Bluetooth is off", "20-bluetooth-off-error"],
      ["connect-timeout", "Connection timed out", "21-connection-timeout"],
      ["connect-failed", "Could not connect", "22-connection-failed"],
    ]) {
      await selectAndRun(page, scenario);
      await page.getByRole("button", { name: "Live" }).click();
      await page.getByText(message, { exact: false }).waitFor({ timeout: 8_000 });
      await capture(page, screenshot, dir);
    }

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open settings" }).click();
    const persistedThreshold = await page.getByLabel("Temperature alert threshold in degrees Celsius").inputValue();
    ensure(persistedThreshold === configuredThreshold, `${width}px setting did not persist after reload`);
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "History" }).click();
    ensure(await page.locator(".event-row").count() > 0, `${width}px event history did not persist after reload`);
    await assertPhoneLayout(page, width);

    await page.getByRole("button", { name: "Live", exact: true }).click();
    await page.getByRole("button", { name: "Run S3 replay", exact: true }).click();
    await page.getByText("Building history", { exact: true }).waitFor();
    await capture(page, "23-coldtrace-s3-warming", dir);
    await page.locator(".node-label").getByText("Replay complete", { exact: true }).waitFor({ timeout: 25_000 });
    ensure((await page.locator(".forecast-result strong").textContent())?.trim() === "0.13", `${width}px S3 replay did not reach the expected rounded raw score`);
    ensure(await page.locator(".forecast-result").getByText("No model alert", { exact: true }).count() === 1, `${width}px normal S3 trace incorrectly alerted`);
    ensure(await page.locator("[data-screen='live'] .temperature-feature").count() === 0, `${width}px EDGE-3 trace leaked into ColdLoop temperature conditions`);
    await capture(page, "24-coldtrace-s3-ready", dir);
    await page.getByRole("button", { name: "Device", exact: true }).click();
    await page.getByText("EDGE-3 · 15-byte v1", { exact: true }).waitFor();
    await capture(page, "25-coldtrace-device", dir);
    await page.getByRole("button", { name: "Open settings" }).click();
    ensure(await page.getByLabel("Temperature alert threshold in degrees Celsius").count() === 0, `${width}px ColdLoop-only threshold appeared for EDGE-3`);
    await capture(page, "26-coldtrace-settings", dir);

    ensure(pageErrors.length === 0, `${width}px page errors: ${pageErrors.join(" | ")}`);
    ensure(consoleErrors.length === 0, `${width}px console errors: ${consoleErrors.join(" | ")}`);
    viewportResults.push({ width, height, status: "PASS", layout, pageErrors, consoleErrors });
  } catch (error) {
    let pageState;
    try {
      pageState = await page.evaluate(() => ({ title: document.title, url: location.href, body: document.body.innerText.slice(0, 1800) }));
      await capture(page, "00-failure-state", dir);
    } catch { /* The browser may have closed before diagnostics were collected. */ }
    failures.push({ viewport: `${width}x${height}`, message: error instanceof Error ? error.stack ?? error.message : String(error), pageState, pageErrors, consoleErrors });
    throw error;
  } finally {
    await context.close();
  }
}

async function runShowcaseJourney(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    if (location.origin !== "http://127.0.0.1:4174" || sessionStorage.getItem("coldloop-qa-reset")) return;
    localStorage.clear();
    sessionStorage.setItem("coldloop-qa-reset", "1");
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  const dir = path.join(outputDir, "1440x1000-showcase");
  await mkdir(dir, { recursive: true });
  try {
    await page.goto(`${baseUrl}/showcase`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Show the condition journey" }).waitFor();
    await page.getByText("Connected", { exact: true }).first().waitFor();
    await page.getByText("Simulated data", { exact: true }).waitFor();
    ensure(await page.locator(".showcase-scenarios .scenario-button").count() === 3, "showcase should expose only the 3 presenter scenarios by default");
    ensure(await page.locator(".showcase-advanced").evaluateAll((details) => details.every((details) => !details.open)), "advanced controls should start collapsed");
    await capture(page, "01-showcase-normal", dir);
    const layout = await page.evaluate(() => {
      const phone = document.querySelector(".showcase-device").getBoundingClientRect();
      const controls = document.querySelector(".showcase-controls").getBoundingClientRect();
      return { width: window.innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, phoneWidth: phone.width, controlsWidth: controls.width };
    });
    ensure(layout.documentWidth <= 1441 && layout.bodyWidth <= 1441, `desktop showcase horizontal overflow: ${JSON.stringify(layout)}`);
    ensure(layout.phoneWidth >= 430 && layout.phoneWidth > layout.controlsWidth, `showcase phone is not visually dominant: ${JSON.stringify(layout)}`);
    await page.getByRole("button", { name: "Excursion", exact: true }).click();
    await page.waitForFunction(() => Number(document.querySelector(".temperature-value strong")?.textContent) >= 6.5, null, { timeout: 6_000 });
    await capture(page, "02-showcase-rising", dir);
    await page.locator(".warning-banner").waitFor({ timeout: 12_000 });
    ensure(await page.locator(".source-tag").count() === 1, "showcase warning must keep exactly one simulated-source label");
    ensure(await page.locator(".showcase-scenarios .scenario-button").count() === 3, "showcase warning must retain only the 3 primary presenter scenarios");
    await capture(page, "03-showcase-warning", dir);
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "History" }).click();
    ensure(await page.locator(".event-row").count() === 1, "showcase excursion should create exactly one event");
    ensure(await page.locator(".event-state.state-active").count() === 1, "showcase excursion event should be active");
    await capture(page, "04-showcase-active-history", dir);
    await page.locator(".event-row").first().click();
    await page.getByRole("dialog").getByText("Simulated", { exact: true }).waitFor();
    await capture(page, "05-showcase-event-detail", dir);
    await page.keyboard.press("Escape");
    await page.locator('[role="dialog"][aria-labelledby="event-detail-heading"]').waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Recovery", exact: true }).click();
    await page.getByText(/Last event recovered/).waitFor({ timeout: 8_000 });
    await capture(page, "06-showcase-recovery", dir);
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "History" }).click();
    ensure(await page.locator(".event-row").count() === 1, "showcase recovery duplicated the event");
    await page.getByText("Recovered", { exact: true }).first().waitFor();
    await capture(page, "07-showcase-recovered-history", dir);
    await page.getByRole("button", { name: "Stop simulation" }).click();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Live" }).click();
    await page.getByText("Connect a sensor node").waitFor();
    ensure(await page.locator(".source-tag").count() === 0, "showcase clean stop retained a simulated source label");
    await capture(page, "08-showcase-stopped", dir);
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "History" }).click();
    ensure(await page.locator(".event-row").count() === 1, "showcase clean stop cleared its completed event");
    await capture(page, "09-showcase-stopped-history", dir);

    await page.getByRole("button", { name: "Live", exact: true }).click();
    await page.getByRole("button", { name: "Run shipment replay", exact: true }).click();
    await page.getByText("Building history", { exact: true }).waitFor();
    await capture(page, "10-coldtrace-s3-warming", dir);
    await page.locator(".node-label").getByText("Replay complete", { exact: true }).waitFor({ timeout: 25_000 });
    ensure((await page.locator(".forecast-result strong").textContent())?.trim() === "0.13", "showcase S3 production replay score mismatch");
    ensure(await page.locator(".forecast-result").getByText("No model alert", { exact: true }).count() === 1, "showcase normal S3 replay unexpectedly alerted");
    await capture(page, "11-coldtrace-s3-ready", dir);
    await page.locator(".evaluation-controls summary").click();
    await page.getByRole("button", { name: "Run S2 evaluation", exact: true }).click();
    await page.locator(".forecast-alert").waitFor({ timeout: 25_000 });
    await page.locator(".node-label").getByText("Replay complete", { exact: true }).waitFor({ timeout: 25_000 });
    await capture(page, "12-coldtrace-s2-evaluation-alert", dir);
    await page.locator(".forecast-alert").click();
    await page.getByRole("dialog").getByText("Evaluation only", { exact: true }).waitFor();
    await page.getByRole("dialog").getByText("coldtrace-edge3-logistic-s2-loso-v1", { exact: true }).waitFor();
    await capture(page, "13-coldtrace-s2-event-detail", dir);
    await page.keyboard.press("Escape");
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "History" }).click();
    ensure(await page.locator(".forecast-event-row").count() === 1, "S2 evaluation event was not retained in history");
    await page.locator(".forecast-event-row").click();
    await page.getByRole("dialog").getByText("Evaluation only", { exact: true }).waitFor();
    await capture(page, "14-coldtrace-history-detail", dir);
    ensure(pageErrors.length === 0, `showcase page errors: ${pageErrors.join(" | ")}`);
    ensure(consoleErrors.length === 0, `showcase console errors: ${consoleErrors.join(" | ")}`);
    viewportResults.push({ width: 1440, height: 1000, status: "PASS", layout, pageErrors, consoleErrors, route: "/showcase" });
  } catch (error) {
    let pageState;
    try {
      pageState = await page.evaluate(() => ({ title: document.title, url: location.href, body: document.body.innerText.slice(0, 1800) }));
      await capture(page, "00-failure-state", dir);
    } catch { /* The browser may have closed before diagnostics were collected. */ }
    failures.push({ viewport: "1440x1000 showcase", message: error instanceof Error ? error.stack ?? error.message : String(error), pageState, pageErrors, consoleErrors });
    throw error;
  } finally {
    await context.close();
  }
}

const server = spawn(process.execPath, [viteCli, "preview", "--host", "127.0.0.1", "--port", "4174", "--strictPort"], {
  cwd: appDir,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
server.stdout.on("data", (chunk) => process.stdout.write(chunk));
server.stderr.on("data", (chunk) => process.stderr.write(chunk));

let exitCode = 0;
try {
  await waitForServer(server);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    await runPhoneJourney(browser, 360, 800);
    await runPhoneJourney(browser, 390, 844);
    await runPhoneJourney(browser, 412, 915);
    await runShowcaseJourney(browser);
  } finally {
    await browser.close();
  }
} catch (error) {
  exitCode = 1;
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
} finally {
  server.kill();
  if (server.exitCode === null) await new Promise((resolve) => server.once("exit", resolve));
  await delay(200);
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    status: exitCode === 0 ? "PASS" : "FAIL",
    viewports: viewportResults,
    screenshots,
    failures,
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`QA report: ${path.relative(repoDir, reportPath)}\nScreenshots: ${screenshots.length}\n`);
}
process.exitCode = exitCode;
