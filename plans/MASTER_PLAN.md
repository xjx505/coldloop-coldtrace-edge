# ColdLoop Master Plan

This plan is ordered by risk and dependency. Do not jump directly into visual polish while Android build or transport architecture is unresolved, and do not spend the night polishing firmware internals that already build.

## Phase 0: establish truth and preserve rollback

- Inspect existing firmware, app, tests, wiring docs, and git status.
- Run the current baseline build/tests and record results.
- Create a clean baseline commit before large refactors if the repository is not yet committed.
- Do not include generated toolchains, .pio output, emulator images, node_modules, or other caches in git.
- Remove only obvious temporary supervisor-test artifacts, not useful project evidence.
- Update `context/RUN_STATE.md` with the observed baseline.

Exit condition: current behavior is reproducible and there is a diffable baseline.

## Phase 1: lock the shared data contract

- Verify the firmware packet structure, service UUID, telemetry UUID, update interval, flags, units, endianness, sensor readiness semantics, and serial JSON.
- Extract protocol parsing into a shared app module with deterministic test vectors.
- Add golden packet fixtures: normal, warm-up, temperature excursion, VOC excursion, combined warning, DHT fault, ENS fault, malformed packet.
- Preserve the existing 20-byte binary telemetry packet unless a concrete defect requires change.
- Keep human-readable serial JSON for physical bring-up/debug.
- If useful, add a separate optional debug-readable BLE characteristic, but only if it does not destabilize the demo.

Exit condition: firmware and application agree on exact test vectors and automated tests prove decoding.

## Phase 2: app architecture

Target architecture:

React + Vite + TypeScript
-> transport abstraction
   -> NativeBleTransport for Android
   -> WebBleTransport only where useful
   -> MockTransport for deterministic QA/demo
-> shared domain/state layer
-> responsive UI
-> Capacitor Android wrapper
-> /showcase route using the same app UI inside a phone presentation surface

Prefer the maintained `@capacitor-community/bluetooth-le` plugin for BLE central functionality. Use it as infrastructure, not as a reason to inherit a generic BLE-demo interface.

Core transport contract should support:
- initialize;
- discover/request ColdLoop device;
- connect;
- disconnect;
- subscribe to telemetry;
- connection state changes;
- clean errors for permission denied / Bluetooth off / device missing / timeout / malformed packet;
- reconnect flow.

Exit condition: MockTransport can drive the entire app; native BLE path compiles and shares exactly the same data/event interface.

## Phase 3: information architecture and final visual system

Design the app around user questions:

Live:
- Is the device connected?
- Is the cargo condition normal?
- What is temperature now?
- What is humidity now?
- Is air/VOC condition normal?
- What changed recently?
- Is there an active event requiring attention?

History:
- What abnormal events happened?
- When?
- Which metric triggered?
- How severe and how long?
- Did the condition recover?

Device:
- Is each sensor available and trustworthy?
- ENS160 warming/ready/fault?
- MQ-135 stabilizing/baseline state?
- DHT22 ready/fault?
- BLE signal/connection if available?
- firmware/app version where useful?

Settings:
- temperature threshold/profile;
- warning sensitivity / demo profile;
- units if implemented;
- re-baseline/calibration action;
- demo mode controls;
- reset local history if needed.

Use progressive disclosure. The home screen is not a dumping ground for every raw number.

Visual direction:
- warm neutral/light interface preferred;
- off-white/very light gray surfaces;
- charcoal typography;
- restrained green only for normal/success;
- amber for caution;
- red for critical;
- strong spacing and typography hierarchy;
- no dark blue/purple AI aesthetic;
- no meaningless gradient blobs, radial gauges, particles, decorative waveforms, or random donut/radar charts;
- no emoji UI.

Every chart must answer a concrete question. Prefer time-series, threshold bands, small recent-trend sparklines, state indicators, and event timeline markers.

Exit condition: the core UI is coherent at 360x800 before broad feature expansion.

## Phase 4: deterministic demo scenarios

MockTransport must support reproducible scenarios using the same packet/domain path as real BLE:

1. disconnected;
2. scanning;
3. connecting;
4. connected normal;
5. ENS160 warm-up;
6. temperature rising;
7. sustained temperature excursion;
8. VOC/air-quality excursion;
9. combined condition warning;
10. DHT fault;
11. ENS fault;
12. malformed packet;
13. notification stream pause;
14. disconnect;
15. successful reconnect;
16. recovery to normal.

Scenario transitions should generate history/events exactly as real telemetry would.

Exit condition: every major UI state can be invoked deterministically without hardware.

## Phase 5: Android toolchain and native package

- Prefer user-local installation of JDK/Android SDK/command-line tools.
- Avoid UAC/system-wide installation unless unavoidable.
- Install/configure only what is needed.
- Add Capacitor Android platform.
- Build a debug APK.
- Create/start an AVD appropriate for phone testing.
- Install with ADB.
- Launch and interact with the APK.
- Validate Android Back, cold launch, warm launch, foreground/background, route persistence where applicable, keyboard/viewport behavior, and no WebView-only layout defects.
- Capture Android-native screenshots after final UI changes.

Physical Bluetooth radio behavior is not guaranteed by the standard emulator. Do not let experimental radio virtualization block the core build. If current emulator networking provides a practical BLE test path, time-box investigation; otherwise use MockTransport for Android UI QA and leave only real-radio verification for morning.

Exit condition: APK installs and the entire non-radio app experience works interactively in the emulator.

## Phase 6: web showcase

Build a dedicated presentation route that displays the real app inside a tasteful phone shell on desktop. Requirements:
- same React components/state, not a separately mocked HTML copy;
- deterministic scenario controls for presentation/testing;
- responsive phone viewport;
- no fake phone chrome that obscures the actual app;
- usable standalone on mobile as well as presentation-friendly on desktop;
- offline/demo fallback.

Exit condition: desktop browser can demonstrate the same experience without hardware.

## Phase 7: automated and visual QA loop

Mechanical checks:
- build/lint/typecheck/tests;
- no console errors;
- no horizontal overflow;
- touch targets at least approximately 44-48 CSS px for primary interactive controls;
- no clipped labels;
- no controls hidden behind safe areas or fixed navigation;
- predictable scrolling;
- major screen reader/semantic basics where feasible.

Journey screenshots:
- 360x800;
- 390x844;
- 412x915;
- one desktop/showcase viewport.

Required journey:
launch -> disconnected -> scan/connect -> connected normal -> open metric detail -> return -> trigger temperature rise -> warning -> event detail -> history -> reconnect -> device health -> settings -> demo controls.

Review screenshots as a sequence. Record issues in `qa/reports/VISUAL_AUDIT.md` with severity:
P0 broken
P1 major usability defect
P2 polish
P3 optional

Fix P0/P1 before completion. Regenerate screenshots after the fixes.

Exit condition: latest screenshots are from the latest build and no P0/P1 issue remains.

## Phase 8: firmware and morning physical path

Do not over-refactor working firmware. Verify:
- hardware build;
- simulation build;
- pins centralized;
- sensor faults handled;
- ENS160 address detection;
- sensor readiness represented;
- DHT sample timing respected;
- MQ-135 value used as relative signal;
- BLE service/characteristic match app;
- disconnect/reconnect behavior reasonable;
- serial JSON remains available.

Create `MORNING_RUNBOOK.md` with:
1. exact wiring;
2. safe MQ-135 divider warning;
3. first power-up order;
4. firmware flash command;
5. serial sanity checks;
6. APK location/install command;
7. BLE connection steps;
8. expected values/state;
9. simple judge demo procedure using safe warm air rather than destructive heating;
10. fallback if one sensor fails;
11. fallback to demo mode.

Exit condition: user can perform final physical integration without reading the whole repository.

## Phase 9: final evidence audit

Run all required gates again after the final meaningful change. Update:
- `qa/FINAL_STATUS.json`;
- `context/RUN_STATE.md`;
- `qa/reports/FINAL_AUDIT.md`;
- `MORNING_RUNBOOK.md`.

Do not mark physical BLE/sensor behavior PASS without real hardware evidence. Mark it PHYSICAL_REQUIRED.

Goal completion is permitted only after the final audit.
