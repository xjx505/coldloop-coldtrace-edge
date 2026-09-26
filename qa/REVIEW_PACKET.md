# ColdLoop independent review packet

Prepared 2026-09-26 from the current working tree for an adversarial review.

## Current disposition

All 72 non-physical REQUIRED entries in `qa/FINAL_STATUS.json` are recorded PASS with evidence. Physical sensor behavior (B8) and physical phone-to-node BLE (B9) remain `PHYSICAL_REQUIRED`; virtual BLE (F10) remains `OPTIONAL`. Do not treat these as passed by emulator/mock evidence.

Review the entire tree at `%USERPROFILE%\Documents\ColdLoop`, including untracked files. The product work is intentionally uncommitted; ordinary `git diff` omits the new React, Android, QA and report files. Baseline HEAD is `e081607504f53e812456c8575939fd4cc7b40ec8`.

## Contract to audit first

Read `AGENTS.md` and its required order, then reconcile these binding documents with source and evidence:

- `GOAL_PROMPT.md`
- `context/PRODUCT_REQUIREMENTS.md`
- `context/UX_SPEC.md`
- `plans/MASTER_PLAN.md`
- `qa/QA_GATES.md`
- `qa/FINAL_STATUS.json`
- `qa/FINAL_APP_POLISH_DIRECTIVE.md`
- `qa/INTERACTION_MATRIX.md`
- Scientific truth requirements in `context/PRODUCT_REQUIREMENTS.md` and Section E of `qa/QA_GATES.md`

For field work and transport wire truth, also read `MORNING_RUNBOOK.md`, `context/HARDWARE_PROTOCOL.md` and `docs/BLE_PROTOCOL.md`.

## Source map

- Shared UI/showcase and navigation: `app/src/App.tsx`, `app/src/screens/ProductScreens.tsx`, `app/src/styles.css`.
- Condition logic, protocol parser and fixtures: `app/src/domain/engine.ts`, `app/src/domain/protocol.ts`, `app/src/domain/fixtures.ts` and `app/src/domain/*.test.ts`.
- BLE, deterministic simulation and transport errors: `app/src/transport/BleTransport.ts`, `app/src/transport/MockTransport.ts`, `app/src/transport/TelemetryTransport.ts` and their tests.
- State, local Settings/History and lifecycle: `app/src/state/`.
- Native permissions and Android package: `app/android/app/src/main/AndroidManifest.xml`, `app/capacitor.config.ts`, `app/package.json`.
- ESP32-C3 wire packet, UUIDs and serial JSON: `firmware/include/config.h`, `firmware/src/main.cpp`; compare protocol docs above.
- Browser, accessibility and APK journeys: `app/scripts/qa-journey.mjs`, `app/scripts/qa-accessibility.mjs`, `app/scripts/qa-android.mjs`.

## Evidence index

| Evidence | Current result | Limits |
|---|---|---|
| `qa/FINAL_STATUS.json` | Gate-by-gate status and evidence pointers | Assertions require audit; they are not themselves product proof |
| `qa/reports/final-gate-assertion-20260926.log` | 72 PASS, 3 physical/optional exemptions, 0 incomplete | Script checks ledger completeness and nonempty evidence, not gate behavior |
| `qa/reports/unit-tests-final-20260926.txt` | 5 files / 17 Vitest tests PASS, including exact event timing boundary | Unit coverage is not emulator or physical-device use |
| `qa/reports/firmware-final-build-20260926.txt` | Current `hardware` and `wokwi` firmware builds PASS | Compile success is not physical sensor/radio validation |
| `qa/reports/android-final-build-20260926.txt` | Final web build, Capacitor sync and debug APK Gradle build PASS | Pair with APK hash and installed journey below |
| qa/reports/web-journey.json plus qa/screenshots/web/ | 84 frames; 360x800, 390x844, 412x915 and 1440x1000 showcase PASS with no overflow/page/console failures | Latest manifest and current web directory match exactly; 24 superseded/unreferenced images are preserved in qa/screenshots/archive/superseded-web-20260926/; current desktop warning frame: qa/screenshots/web/1440x1000-showcase/03-showcase-warning.png |
| `qa/reports/android-journey.json` plus `qa/screenshots/android/` | Final APK installed; 24 frames / 38 steps, zero runtime exceptions, no fatal exception | Android 16/API 36 emulator and MockTransport, not a physical phone/node |
| `qa/screenshots/android/21-font-scale-130-live.png` through `23-font-scale-130-settings-scroll.png` | Native WebView reviewed at Android system font scale 1.3; Live actions stay visible, Settings scrolls, bottom navigation stays fixed | Supplemental manual accessibility evidence; emulator scale restored to 1.0 |
| `qa/reports/ACCESSIBILITY_AUDIT.md` and `accessibility-20260926.json` | 13 states, zero axe violations; keyboard skip/modal focus/Escape checks pass | Axe leaves three color-contrast nodes incomplete for overlap; manual CSS-token contrast calculation is recorded in the Markdown report |
| `qa/reports/VISUAL_AUDIT.md` | Connected web/Android journeys reviewed; P0=0 and P1=0 | Visual review is bounded to the captured states/viewports |
| `qa/reports/android-permissions-20260926.txt` | Runtime permission denial, Settings recovery, grant and native BLE picker entry on API 36 | No peripheral attached; not physical discovery/GATT/notifications |
| `qa/reports/physical-inventory-20260926.txt` | ADB and serial inventory establish why physical gates could not be run | Recheck inventory during the physical session |
| `qa/screenshots/archive/superseded-web-20260926/` | 24 older/unreferenced web frames retained outside the current screenshot set, including pre-polish duplicate Demo showcase captures | Do not use archived frames as current UI evidence |
| `MORNING_RUNBOOK.md` | Exact safe bring-up, build/flash/serial, APK install and deterministic fallback steps | Follow physical board labels and voltage checks before wiring |
| `context/RUN_STATE.md`, `context/FAILURES.md`, `context/DECISIONS.md` | Current state, failed approaches and decisions | Read for prior tooling/harness retries and the physical boundary |

## Current artifact identity

| Artifact | Path | Size | SHA-256 |
|---|---|---:|---|
| Debug APK `com.coldloop.monitor` v1.0 / code 1 | `app/android/app/build/outputs/apk/debug/app-debug.apk` | 4,313,167 bytes | `F32C81BAEDB531E0879EB2773DFF9AA7FD6BCDDEFEF790F090E0005BCF84F6DB` |
| Hardware firmware | `firmware/.pio/build/hardware/firmware.bin` | 1,031,872 bytes | `1DD84BF5D001608CA8E7F97C4D1893D8E6D6EB51D466B7FB78F925C1B47D0378` |
| Wokwi firmware | `firmware/.pio/build/wokwi/firmware.bin` | 1,026,496 bytes | `387FC9F8E34ECB45E7A6E0FA21994CCB738A7F3D1ADAED1323A11BEA3D47D83E` |

The final APK hash above matches the APK installed by the 24-frame Android journey. The API 36 permission/scanner run is separately documented; it proves runtime permission and scanner-entry behavior only.

## Android runtime permission session

The API 36 emulator initially reported Nearby devices permission denied. Tapping Connect opened Android's permission prompt. Denial returned to ColdLoop's permission state, and Settings opened app permission settings. Granting Nearby devices allowed retry into the plugin's BLE picker. No peripheral was attached; the picker showed no node and Cancel returned to ColdLoop without a crash. Screenshots and filtered error output are linked in `qa/reports/android-permissions-20260926.txt`.

## Review focus

1. Trace each REQUIRED gate in `qa/QA_GATES.md` to implementation and current logs/reports/screenshots. The assertion script alone does not prove behavior.
2. Independently inspect exact 20-byte packet layout, byte order, UUIDs, characteristic properties, sequence behavior and serial JSON across firmware and app.
3. Challenge BLE cancel/permission denial/disconnect/reconnect/timeout cleanup and local persistence. Separate emulator scanner entry from physical radio success.
4. Inspect connected 360/390/412 journeys and `/showcase`; focus on disconnected → normal simulation → warning → one event → recovery → stopped simulation with History preserved.
5. Check the 1,499/1,500 ms rule boundary and compare the live event duration display with the configured persistence rule.
6. Audit readiness and scientific wording: MQ-135 is relative, eCO2 is equivalent/estimated, and no food-safety or spoilage prediction is claimed.
7. Review `context/FAILURES.md` for the initial JRE-only build and ADB `pidof` races; the corrected build and final harness runs are saved separately.

## Explicitly unverified

- Real DHT22/ENS160/MQ-135 electrical behavior, calibration and readings: B8 is `PHYSICAL_REQUIRED`.
- Physical ESP32-C3 advertising/discovery, GATT and live notifications on a physical Android phone: B9 is `PHYSICAL_REQUIRED`.
- Virtual Bluetooth radio: F10 is optional and was not demonstrated.

Do not promote any of these to PASS without direct physical evidence.
