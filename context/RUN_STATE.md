## Public release checkpoint (2026-09-26)
The previous final-regression narrative below is historical and is superseded by qa/reports/PUBLICATION_STATUS_20260926.md. Current APK build is recorded there; its final emulator journey was not rerun. Physical ESP32/sensor/BLE checks remain pending.

# Active ColdTrace integration state

Last updated: 2026-09-26 (Asia/Qatar), after Phase 1 P1 fixes, full app suite and accessibility audit.

Current task: complete ColdLoop + ColdTrace Edge integration using qa/COLDTRACE_AI_MASTER_EXECUTION_PLAN.md. Phase 1 is verified; Phase 2 source architecture is in progress. User approval to execute is explicit in the pasted integration directive. Preserve the existing ColdLoop product and clearly separate its one-probe 20-byte protocol from EDGE-3's three-probe 15-byte protocol.

Phase checklist: qa/COLDTRACE_PROGRESS.md. Baseline and rollback evidence: qa/reports/COLDTRACE_BASELINE_20260926.md; local rollback commit 6ee8c19369fdbd0b86805ac171b430e6ff54bbcc. Initial clean-room reads followed the pasted directive's order and AGENTS.md's required context order before product-code edits.

Baseline observed:
- Starting branch master at e081607504f53e812456c8575939fd4cc7b40ec8; 19 tracked modifications and 304 untracked files were present at start; these were captured in baseline commit 6ee8c19369fdbd0b86805ac171b430e6ff54bbcc from the prior ColdLoop product work. This includes the app, native Android project, local AI bundle, reports and screenshots; do not mistake these for ColdTrace integration changes.
- Fresh existing app tests: 17/17 PASS. Fresh TypeScript/Vite build: PASS.
- Fresh existing hardware and Wokwi firmware builds: PASS.
- Local AI ZIP checksum matches plan; portable runner passes 24 production vectors, 24 S2 evaluation vectors, warm-up and timestamp-gap checks.
- Existing Android/web/accessibility product evidence remains as referenced in qa/FINAL_AUDIT.md and qa/FINAL_STATUS.json. It is baseline evidence only and cannot satisfy ColdTrace-specific offline acceptance.
- Physical EDGE-3 hardware/three-probe BLE has not been observed. No fake probe mapping is permitted; only physical radio/sensor verification may remain physical-required after software QA.
# Run State

Last updated: 2026-09-26 (Asia/Qatar), after final duration-boundary fix, desktop warning capture and regenerated web/Android evidence.

## Current status

COLDLOOP_BASELINE_COMPLETE_COLDTRACE_INTEGRATION_IN_PROGRESS_PHYSICAL_SENSOR_AND_RADIO_VALIDATION_REMAINS

All 72 required non-physical gates are PASS with evidence in `qa/FINAL_STATUS.json`. B8 physical sensor behavior and B9 physical phone-to-node BLE remain `PHYSICAL_REQUIRED`; F10 virtual BLE remains `OPTIONAL`. Final automated ledger assertion: `qa/reports/final-gate-assertion-20260926.log` (72 PASS, 3 exempt, 0 incomplete). The assertion is a consistency check, not behavioral proof.

The implementation and polish edits are directly under `<LOCAL_USER_PATH>\Documents\ColdLoop`. `AGENTS.md` and its required files were read in order before product-code edits. Current project edits remain uncommitted; baseline HEAD is `e081607504f53e812456c8575939fd4cc7b40ec8`.

## Product delivered

- React/Vite/TypeScript with one shared app surface for Capacitor Android, standalone phone web and `/showcase`.
- Live conditions, temperature/air/VOC detail, trend/threshold visualization, active/recovered/interrupted History, Device/sensor health, functional Settings, bounded local persistence and explicit stale/error/reconnect states.
- Native Android BLE transport uses maintained `@capacitor-community/bluetooth-le`; one central notification path, UUID filtering, permissions, cleanup/reconnect and timeout/GATT errors are handled.
- Deterministic offline simulation has a normal → rising excursion → warning event → recovery → clean stop flow. Completed History survives stopping. The core scenario controls are visible; engineering/failure fixtures are under Advanced scenarios.
- Live shows one neutral `Simulated data` source label; History/event detail record `Simulated` provenance once. Device/Settings hierarchy and modal keyboard focus/accessibility were polished without changing the warm-neutral visual design.
- Condition warning starts after three consecutive high readings spanning at least 1,500 ms. A unit boundary test proves no event at 1,499 ms and one at 1,500 ms; active-event duration rounds to nearest second to avoid underreporting as `1s`.
- Firmware and app preserve the packed 20-byte little-endian packet and shared service/characteristic UUIDs. Serial JSON remains available. MQ-135 baseline bit means 30 nonzero readings formed a relative baseline; it is not physical heater warm-up or gas calibration.
- Scientific boundaries remain explicit: MQ-135 is a broad relative signal, ENS160 eCO2 is an estimate, and the app does not certify food safety or claim spoilage/shelf life or expiry extension.

## Final regression evidence

- `qa/reports/firmware-final-build-20260926.log`: fresh hardware and Wokwi PlatformIO builds both PASS.
- `qa/reports/unit-tests-final-20260926.log`: 5 files / 17 Vitest tests PASS.
- `qa/reports/android-final-build-20260926.log`: final Vite build, Capacitor sync and Android debug APK Gradle build PASS using user-local JDK 21/SDK process variables.
- `qa/reports/web-journey.json`: PASS, 84 screenshots, 360x800, 390x844, 412x915 and 1440x1000 `/showcase`; zero page/console errors or horizontal overflow.
- `qa/reports/android-journey.json`: final APK installed on Android 16/API 36 `emulator-5554`; PASS, 24 screenshots, 38 steps, zero WebView exceptions and no fatal AndroidRuntime exception. Includes cold launch, touch-driven simulation, warning/recovery, device faults, Settings, Back, background/foreground, process restart, persistence and screenshots after the duration-rounding change.
- `qa/reports/ACCESSIBILITY_AUDIT.md` plus `accessibility-20260926.json`: axe WCAG 2.1 A/AA and best-practice checks on 13 states, zero violations; keyboard skip/modal focus/Escape checks pass. Contrast overlap nodes are disclosed; manual token ratios exceed 5:1. Screenshots 21–23 verify native 1.3 text scale; Android preference restored to 1.0.
- `qa/reports/VISUAL_AUDIT.md`: connected journey inspection at required sizes, findings and dispositions; P0=0, P1=0.
- `qa/reports/android-permissions-20260926.txt`: API 36 Android runtime permission deny/recovery/grant and native BLE picker/no-device cancel. Does not claim physical discovery or GATT.
- `qa/reports/FINAL_AUDIT.md` and `qa/REVIEW_PACKET.md`: current artifact hashes, review source map, evidence limits and physical morning steps.
- `qa/reports/physical-inventory-20260926.txt`: only an emulator and no ESP32 serial connection/physical phone were available.

## Final artifacts

- APK: `app/android/app/build/outputs/apk/debug/app-debug.apk`; `com.coldloop.monitor` v1.0/code 1; 4,313,167 bytes; SHA-256 `F32C81BAEDB531E0879EB2773DFF9AA7FD6BCDDEFEF790F090E0005BCF84F6DB`.
- Hardware firmware: `firmware/.pio/build/hardware/firmware.bin`; 1,031,872 bytes; SHA-256 `1DD84BF5D001608CA8E7F97C4D1893D8E6D6EB51D466B7FB78F925C1B47D0378`.
- Wokwi firmware: `firmware/.pio/build/wokwi/firmware.bin`; 1,026,496 bytes; SHA-256 `387FC9F8E34ECB45E7A6E0FA21994CCB738A7F3D1ADAED1323A11BEA3D47D83E`.

## Android toolchain and physical next steps

Use the user-local Temurin JDK 21 and Android SDK under `%LOCALAPPDATA%\ColdLoopToolchain` and `%LOCALAPPDATA%\Android\Sdk`, process-scoped as shown in `MORNING_RUNBOOK.md`; no system-wide Java setting was changed. Default shell Java points to a runtime-only Java 17 JRE, so direct Gradle builds need the documented environment.

No physical sensor/node or phone is attached. Morning: verify C3 labels and the MQ-135 10kΩ/20kΩ AOUT divider voltage first; bring sensors up individually and inspect readiness/serial JSON; flash hardware firmware; pair a physical phone and confirm advancing notifications; perform a safe warm-air warning → History → recovery demonstration. If hardware is absent, use the labelled deterministic app simulation. See `MORNING_RUNBOOK.md` for exact commands.

No unresolved non-physical blocker remains. Emulator/mock state is not evidence of physical BLE or sensor behavior.


## ColdTrace integration checkpoint (2026-09-26)

Phase 1 P1 fixes and verification passed: 19 app tests, TypeScript/Vite production build, and a 13-state axe accessibility run. See qa/COLDTRACE_PROGRESS.md and qa/reports/coldtrace-phase1-*.txt. The ColdLoop 20-byte decoder remains unchanged. Phase 2 is active: explicit app-level source profile/capabilities and the separate EDGE-3 15-byte profile are next. No ColdTrace prediction is exposed yet.
