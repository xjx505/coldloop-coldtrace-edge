# ColdLoop visual and interaction audit

Date: 2026-09-26  
Result: PASS  
Unresolved P0: 0  
Unresolved P1: 0

## Final evidence set

- Web/showcase: `qa/reports/web-journey.json` PASS; 84 screenshots cover the connected app flow and operational states at 360x800, 390x844 and 412x915, plus `/showcase` at 1440x1000. All four viewports report zero horizontal overflow, page errors or console errors.
- Android: `qa/reports/android-journey.json` PASS; the final APK run records 24 screenshots, 38 steps, zero WebView runtime exceptions and no fatal AndroidRuntime exception. The journey includes real touch activation, navigation, Back, background/foreground, cold restart, and persisted Settings/History.
- Larger-text Android check: system font scale 1.3, captured in `qa/screenshots/android/21-font-scale-130-live.png`, `22-font-scale-130-settings.png` and `23-font-scale-130-settings-scroll.png`; the emulator preference was restored to 1.0 after capture.
- Accessibility: `qa/reports/ACCESSIBILITY_AUDIT.md` and `accessibility-20260926.json` PASS with zero axe violations across 13 representative states; keyboard skip link, modal focus loop, Escape, and focus return are covered. The two color-contrast items axe marked incomplete are manually reviewed; the foreground/surface CSS token combinations exceed 5:1. Android screenshots show the same high-contrast surfaces at the larger text scale.

## Journeys reviewed

The core mobile route was reviewed as a connected sequence: disconnected Live and empty History → deterministic normal readings → temperature detail → rising readings → visible warning → active event detail → History → event detail → recovery in Live and History → stop simulation while preserving completed History. The same app components and controller are used in `/showcase`; its Normal, Excursion and Recovery controls drive the identical product surface.

At 360x800, the warning banner, condition card, secondary metrics, useful trend and bottom navigation remain visible without crowding. At 390x844, the warning state keeps the same hierarchy and controls. At 412x915, Settings keeps its threshold, three core simulation controls, progressive Advanced scenarios, baseline note and local-history controls in a calm vertical layout. The stale-stream state makes its age and reconnect action clear. The 1440x1000 showcase places the actual app in a larger phone frame and gives presenter controls a clean, short hierarchy.

The operational state set includes ENS160 warming/fault, DHT22 fault, no device, permission denial, stale stream, malformed packet, Bluetooth off, connect timeout and connect failure. Empty, active and recovered History states were reviewed. Device details disclose connection/protocol metadata progressively rather than leading with UUIDs.

## Findings and dispositions

- Cold launch once implied a ready source without a transport. The source chip is now absent until BLE or deterministic simulation exists; both web and Android cold-launch journeys assert this.
- Repeated Demo labels competed with the condition. Live now uses one neutral `Simulated data` source label; History and event detail use a concise `Simulated` provenance label once per record.
- Stopping a running simulation now clears synthetic Live data and interrupts an unfinished event while preserving completed History. The three primary scenarios are always visible; engineering/failure fixtures remain under Advanced scenarios.
- Device health emphasizes node/sensor readiness; connection metadata remains in expandable details. Settings exposes only functional controls and a progressive advanced section.
- An active event could display `1s` immediately after its 1.5-second threshold rule fired because elapsed time was rounded down. Duration now rounds to the nearest second; the unit boundary test verifies no event at 1,499 ms and event creation at 1,500 ms. The regenerated warning frame shows `2s`.
- The Android harness now tolerates the normal `pidof` launch/stop race and reconnects to WebView DevTools after screenshot I/O. Its final cold-launch, foreground and restart frames show the expected surfaces.
- A final manifest check found 24 older, unreferenced web frames (including a pre-polish duplicate-Demo showcase image). They were preserved under `qa/screenshots/archive/superseded-web-20260926/`; the current web screenshot directory now matches the 84-frame journey manifest exactly. The current desktop warning frame is qa/screenshots/web/1440x1000-showcase/03-showcase-warning.png.

The palette stays warm-neutral with restrained state colors. Charts carry trend/threshold meaning; the dashed threshold is labelled. No decorative-only visual, emoji UI, unsupported spoilage metric, exact MQ-135 gas claim, direct-CO2 claim, or food-safety certification appears. Normal remains calm, while warning escalation uses a clear red banner and value state.

## Final disposition

No clipped primary values, obscured navigation, horizontal overflow, duplicated event, stale source indicator, or P0/P1 visual or interaction defect remains in the reviewed evidence. Target phone controls meet the 44px minimum checked by the web journey. At 130% Android text scale, Live actions and fixed navigation remain available; the longer Settings screen scrolls while its navigation stays fixed.

This is software and deterministic-demo evidence only. Physical sensor response and physical phone-to-ESP32 BLE notifications remain `PHYSICAL_REQUIRED` as recorded in `qa/FINAL_STATUS.json`.
