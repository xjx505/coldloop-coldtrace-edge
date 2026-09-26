import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoDir = path.resolve(appDir, "..");
const reportPath = path.join(repoDir, "qa", "reports", "accessibility-20260926.json");
const markdownPath = path.join(repoDir, "qa", "reports", "ACCESSIBILITY_AUDIT.md");
const baseUrl = "http://127.0.0.1:4175";
const viteCli = path.join(appDir, "node_modules", "vite", "bin", "vite.js");
const axePath = path.join(appDir, "node_modules", "axe-core", "axe.min.js");
const results = [];
const manualChecks = [];

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer(server) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Vite preview exited with ${server.exitCode}`);
    try { if ((await fetch(baseUrl)).ok) return; } catch { /* Preview is still starting. */ }
    await delay(250);
  }
  throw new Error("Vite preview did not start within 45 seconds.");
}

async function audit(page, state) {
  if (!(await page.evaluate(() => Boolean(window.axe)))) await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async () => {
    const report = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"] },
    });
    return {
      violations: report.violations.map((item) => ({
        id: item.id,
        impact: item.impact,
        help: item.help,
        nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
      passes: report.passes.length,
      incomplete: report.incomplete.map((item) => ({
        id: item.id,
        help: item.help,
        nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    };
  });
  results.push({ state, ...result });
}

async function selectCoreScenario(page, scenario) {
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.locator(`[data-setting-scenario="${scenario}"]`).click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Live" }).click();
}

async function runPhoneAudit(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    if (location.origin === "http://127.0.0.1:4175") localStorage.clear();
  });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const reducedMotionSeconds = await page.evaluate(() => {
      const status = document.querySelector(".header-status");
      const dot = status?.querySelector("i");
      status?.classList.add("working");
      const value = getComputedStyle(dot).animationDuration;
      status?.classList.remove("working");
      const amount = Number.parseFloat(value);
      return value.trim().endsWith("ms") ? amount / 1000 : amount;
    });
    ensure(reducedMotionSeconds <= 0.00001, `Reduced-motion animation duration is not suppressed (${reducedMotionSeconds}s)`);
    manualChecks.push({ check: "Reduced motion", status: "PASS", evidence: `working indicator animation duration ${reducedMotionSeconds}s` });
    ensure(await page.locator('.header-status[role="status"]').count() === 1, "Connection state is missing a live status announcement");
    manualChecks.push({ check: "Live status announcement", status: "PASS", evidence: ".header-status uses role=status" });
    await audit(page, "phone:no-data");

    await page.keyboard.press("Tab");
    ensure(await page.evaluate(() => document.activeElement?.classList.contains("skip-link")), "Skip link is not first in keyboard order");
    await page.keyboard.press("Enter");
    ensure(await page.evaluate(() => document.activeElement?.id === "main-content"), "Skip link did not move focus to main content");

    await page.getByRole("button", { name: "Try demo" }).click();
    await page.getByText("Simulated data", { exact: true }).waitFor();
    await audit(page, "phone:simulation-normal");

    await page.getByRole("button", { name: /Open temperature details/ }).click();
    await page.getByRole("dialog", { name: "Temperature" }).waitFor();
    await audit(page, "phone:temperature-detail-dialog");
    await page.keyboard.press("Shift+Tab");
    ensure(await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Close detail"), "Modal focus did not wrap from the heading to the last control");
    await page.keyboard.press("Tab");
    ensure(await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Back to live"), "Modal focus did not wrap back to its first control");
    await page.keyboard.press("Escape");
    await page.locator('[role="dialog"][aria-labelledby="metric-detail-heading"]').waitFor({ state: "detached" });
    await page.waitForFunction(() => document.activeElement?.classList.contains("temperature-feature"), null, { timeout: 2_000 });

    await selectCoreScenario(page, "temperature-rising");
    await page.locator(".warning-banner").waitFor({ timeout: 12_000 });
    await audit(page, "phone:temperature-warning");
    await page.locator(".warning-banner").click();
    await page.locator('[role="dialog"][aria-labelledby="event-detail-heading"]').waitFor();
    await audit(page, "phone:event-detail-dialog");
    await page.keyboard.press("Escape");
    await page.locator('[role="dialog"][aria-labelledby="event-detail-heading"]').waitFor({ state: "detached" });
    await page.waitForFunction(() => document.activeElement?.classList.contains("warning-banner"), null, { timeout: 2_000 });

    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "History" }).click();
    await audit(page, "phone:active-history");
    await page.locator(".event-row").click();
    await page.locator('[role="dialog"][aria-labelledby="event-detail-heading"]').waitFor();
    await page.keyboard.press("Escape");
    await page.locator('[role="dialog"][aria-labelledby="event-detail-heading"]').waitFor({ state: "detached" });
    await page.waitForFunction(() => document.activeElement?.classList.contains("event-row"), null, { timeout: 2_000 });

    await selectCoreScenario(page, "recovery");
    await page.getByText(/Last event recovered/).waitFor({ timeout: 8_000 });
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "History" }).click();
    await audit(page, "phone:recovered-history");
    await page.getByRole("button", { name: "Device" }).click();
    await audit(page, "phone:device");
    await page.getByRole("button", { name: "Open settings" }).click();
    await audit(page, "phone:settings");
    await page.locator(".advanced-scenarios summary").click();
    await audit(page, "phone:settings-advanced");
    await page.getByRole("button", { name: "Device", exact: true }).click();
    await page.getByRole("button", { name: "S3 replay", exact: true }).click();
    await page.getByRole("button", { name: "Live", exact: true }).click();
    await page.locator(".node-label").getByText("Replay complete", { exact: true }).waitFor({ timeout: 25_000 });
    const chartAlternatives = await page.evaluate(() => [".edge3-chart", ".score-scale"].map((selector) => {
      const element = document.querySelector(selector);
      return { selector, role: element?.getAttribute("role"), label: element?.getAttribute("aria-label") ?? "" };
    }));
    ensure(chartAlternatives.every((item) => item.role === "img" && item.label.length > 20), "ColdTrace charts are missing useful text alternatives");
    manualChecks.push({ check: "ColdTrace chart text alternatives", status: "PASS", evidence: chartAlternatives });
    await audit(page, "phone:coldtrace-s3-ready");
    await page.getByRole("button", { name: "Device", exact: true }).click();
    await audit(page, "phone:coldtrace-device");
  } finally {
    await context.close();
  }
}

async function runShowcaseAudit(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    if (location.origin === "http://127.0.0.1:4175") localStorage.clear();
  });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/showcase`, { waitUntil: "networkidle" });
    await page.getByText("Simulated data", { exact: true }).waitFor();
    ensure(await page.locator(".showcase-scenarios button").count() === 3, "Showcase default scenario controls are not simplified");
    await audit(page, "showcase:normal");
    await page.getByRole("button", { name: "Excursion", exact: true }).click();
    await page.locator(".warning-banner").waitFor({ timeout: 12_000 });
    await audit(page, "showcase:warning");
    await page.locator(".showcase-advanced summary").filter({ hasText: "Simulation checks" }).click();
    await audit(page, "showcase:advanced-scenarios");
    await page.getByRole("button", { name: "Run shipment replay", exact: true }).click();
    await page.locator(".node-label").getByText("Replay complete", { exact: true }).waitFor({ timeout: 25_000 });
    await audit(page, "showcase:coldtrace-s3-ready");
    await page.locator(".evaluation-controls summary").click();
    await page.getByRole("button", { name: "Run S2 evaluation", exact: true }).click();
    await page.locator(".forecast-alert").waitFor({ timeout: 25_000 });
    await page.locator(".node-label").getByText("Replay complete", { exact: true }).waitFor({ timeout: 25_000 });
    await audit(page, "showcase:s2-evaluation-alert");
    await page.locator(".forecast-alert").click();
    await page.getByRole("dialog").waitFor();
    await audit(page, "showcase:s2-evaluation-detail");
  } finally {
    await context.close();
  }
}

const server = spawn(process.execPath, [viteCli, "preview", "--host", "127.0.0.1", "--port", "4175", "--strictPort"], {
  cwd: appDir,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
server.stdout.on("data", (chunk) => process.stdout.write(chunk));
server.stderr.on("data", (chunk) => process.stderr.write(chunk));

let failure = null;
try {
  await waitForServer(server);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await readFile(axePath);
  const browser = await chromium.launch({ headless: true });
  try {
    await runPhoneAudit(browser);
    await runShowcaseAudit(browser);
  } finally {
    await browser.close();
  }
  const violationCount = results.reduce((sum, item) => sum + item.violations.length, 0);
  if (violationCount > 0) failure = `${violationCount} accessibility violations across ${results.length} states`;
} catch (error) {
  failure = error instanceof Error ? error.stack ?? error.message : String(error);
} finally {
  server.kill();
  if (server.exitCode === null) await new Promise((resolve) => server.once("exit", resolve));
  await delay(200);
  const report = {
    generatedAt: new Date().toISOString(),
    status: failure ? "FAIL" : "PASS",
    viewports: ["390x844", "1440x1000"],
    states: results,
    manualChecks,
    failure,
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  const lines = [
    "# ColdLoop Accessibility Audit",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    `Automated checks: axe-core WCAG 2.1 A/AA and best-practice rules in ${results.length} representative states at ${report.viewports.join(" and ")}.`,
    "Keyboard checks: skip link, modal focus loop, Escape close, and trigger-focus return.",
    `Manual checks: ${manualChecks.map((item) => `${item.check} ${item.status}`).join("; ") || "incomplete"}.`,
    "",
    "| State | Violations | Pass rules | Manual review needed |",
    "|---|---:|---:|---|",
    ...results.map((item) => `| ${item.state} | ${item.violations.length} | ${item.passes} | ${item.incomplete.map((entry) => entry.id).join(", ") || "None reported"} |`),
    "",
  ];
  if (failure) lines.push(`Failure: ${failure}`, "");
  await writeFile(markdownPath, `${lines.join("\n")}\n`, "utf8");
  process.stdout.write(`Accessibility audit: ${report.status}\nStates: ${results.length}\nReport: ${path.relative(repoDir, markdownPath)}\n`);
  if (failure) process.stderr.write(`${failure}\n`);
}
if (failure) process.exitCode = 1;
