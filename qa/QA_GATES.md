# ColdLoop QA Gates

This file is the completion contract. Codex may not declare the Goal complete while a REQUIRED non-physical gate is not PASS.

Status vocabulary:
- PASS: verified with evidence generated from the current relevant build.
- FAIL: verified failure.
- NOT_RUN: not yet checked.
- PHYSICAL_REQUIRED: cannot be honestly verified without the physical phone/ESP32/sensors.
- OPTIONAL: useful but not required for overnight completion.

Evidence must point to a command output, test report, screenshot set, APK, source location, or explicit physical procedure. "I checked" is not evidence.

## A. Repository and state

### A1 REQUIRED - context loaded
AGENTS.md and required context/plan files exist and are internally consistent.

Evidence:
- file existence;
- final audit confirms no unresolved contradiction.

### A2 REQUIRED - rollback point
A reproducible baseline exists before major overnight refactor, preferably a git commit.

Evidence:
- git log/status or documented equivalent.

### A3 REQUIRED - durable state
RUN_STATE.md, FAILURES.md, DECISIONS.md and FINAL_STATUS.json are current after the final meaningful change.

## B. Firmware and protocol

### B1 REQUIRED - hardware firmware build
ESP32-C3 hardware firmware compiles successfully.

### B2 REQUIRED - simulation firmware build
Wokwi/simulation firmware compiles successfully.

### B3 REQUIRED - 20-byte protocol contract
Firmware packet structure is verified as exactly 20 bytes unless a deliberately versioned replacement is adopted.

### B4 REQUIRED - shared golden fixtures
App decoder passes golden fixtures for:
- normal;
- warm-up/readiness;
- temperature excursion;
- VOC/air excursion;
- combined warning;
- DHT fault;
- ENS fault;
- malformed/short packet.

### B5 REQUIRED - BLE UUID compatibility
Native app and firmware use identical service/characteristic UUIDs.

### B6 REQUIRED - serial debug path
Firmware still emits human-readable serial telemetry useful for morning bring-up.

### B7 REQUIRED - sensor readiness truth
App/domain model does not treat warm-up/fault/stale sensor data as normal trusted measurements.

### B8 PHYSICAL_REQUIRED - actual sensor electrical behavior
Real DHT22/ENS160/MQ-135 values verified on physical node.

### B9 PHYSICAL_REQUIRED - actual BLE radio
Real Android phone receives physical ESP32-C3 notifications.

## C. Application architecture

### C1 REQUIRED - single shared product UI
Android and web/showcase use the same core app/components/domain model rather than separate fake interfaces.

### C2 REQUIRED - transport abstraction
A transport interface isolates UI/domain logic from Bluetooth implementation.

### C3 REQUIRED - MockTransport
Deterministic mock/demo transport can drive all primary states without hardware.

### C4 REQUIRED - NativeBleTransport
Capacitor Android BLE implementation exists, compiles, and uses maintained plugin infrastructure.

### C5 REQUIRED - central notification subscription
BLE notifications are subscribed centrally rather than independently in many components.

### C6 REQUIRED - graceful transport failures
UI handles:
- Bluetooth off/unavailable where detectable;
- permission denied;
- no device;
- connect failure/timeout;
- disconnect;
- reconnect;
- stale stream;
- malformed telemetry.

## D. Product surfaces

### D1 REQUIRED - Live
Live screen clearly shows:
- connection;
- overall condition;
- temperature;
- humidity;
- air/VOC condition;
- recent trend;
- active warning/event;
- access to more detail.

### D2 REQUIRED - metric detail
Metric drill-down exposes deeper values without crowding Live.

### D3 REQUIRED - History
History/event timeline works for empty and populated states and opens event details.

### D4 REQUIRED - Device
Device/sensor health shows node and sensor readiness/fault states.

### D5 REQUIRED - Settings
Only functional settings are shown; threshold/profile, baseline/calibration where implemented, and demo controls work.

### D6 REQUIRED - local persistence
Settings/history that should persist survive appropriate navigation/relaunch, or the product clearly documents intentional session-only behavior.

### D7 REQUIRED - demo scenario
Normal -> rising temperature -> warning -> event recorded -> recovery is deterministic and reproducible.

## E. Scientific and content truth

### E1 REQUIRED - no exact MQ gas claims
No UI/documentation presents MQ-135 as an exact gas identifier/concentration instrument.

### E2 REQUIRED - eCO2 correctly framed
ENS160 eCO2 is labeled equivalent/estimated, not direct CO2 measurement.

### E3 REQUIRED - no food-safety certification
No UI/documentation claims the prototype certifies safety.

### E4 REQUIRED - no fake spoilage probability/shelf life
Unvalidated heuristic values are not labeled as validated spoilage probability or remaining shelf life.

### E5 REQUIRED - no expiry extension
No product behavior suggests changing legal/printed expiry.

## F. Android package

### F1 REQUIRED - native Android project
Capacitor Android platform exists and syncs.

### F2 REQUIRED - APK build
Debug APK builds successfully from documented command.

### F3 REQUIRED - APK artifact
APK path is recorded and the artifact exists.

### F4 REQUIRED - AVD/emulator
An Android emulator is created/available and boots.

### F5 REQUIRED - install
Current APK installs by ADB.

### F6 REQUIRED - cold launch
App cold-launches successfully on emulator.

### F7 REQUIRED - interaction journey
Emulator journey exercises:
- launch;
- primary navigation;
- demo/mock telemetry;
- metric detail;
- warning;
- history;
- device;
- settings;
- Android Back.

### F8 REQUIRED - lifecycle
At minimum verify app background/foreground and kill/relaunch without broken UI.

### F9 REQUIRED - Android screenshots
Latest Android screenshots are captured after final meaningful UI changes.

### F10 OPTIONAL - virtual BLE radio
Only PASS if a reliable virtual BLE setup is actually demonstrated. It is not required for overnight completion.

## G. Web/showcase

### G1 REQUIRED - showcase route
A desktop presentation route uses the real app UI in a phone presentation surface.

### G2 REQUIRED - deterministic controls
Presenter can trigger normal/excursion/recovery demo without hardware.

### G3 REQUIRED - no duplicate fake UI
Showcase does not maintain a second static copy of product screens.

### G4 REQUIRED - standalone mobile responsiveness
The app itself works at phone viewport sizes independent of the desktop shell.

## H. Mechanical UI quality

Run at least:
- 360x800;
- 390x844;
- 412x915;
- desktop showcase.

### H1 REQUIRED - no horizontal overflow
No accidental page-level horizontal scrolling at target phone widths.

### H2 REQUIRED - no clipped/overlapping core UI
Primary controls, values, warnings, nav and dialogs are not clipped or covered.

### H3 REQUIRED - touch target sanity
Primary interactive targets are approximately 44-48 CSS px or otherwise clearly usable.

### H4 REQUIRED - navigation consistency
Core destinations are reachable without confusing hidden routes.

### H5 REQUIRED - no console/page errors
Primary web journeys produce no unhandled page errors/serious console errors.

### H6 REQUIRED - stale/loading/error states
Loading, empty, stale and error states are visually intentional rather than blank/broken.

## I. Visual product quality

### I1 REQUIRED - no forbidden aesthetic
No dark navy/purple AI-dashboard palette, decorative blobs/particles, emoji UI, meaningless gauges/radar/donut charts.

### I2 REQUIRED - every visual has purpose
Charts/indicators map to a user question: state, magnitude, trend, threshold, history, health or action.

### I3 REQUIRED - hierarchy
Live screen prioritizes connection/condition/temperature before deep technical data.

### I4 REQUIRED - progressive disclosure
Technical values remain accessible without crowding the default screen.

### I5 REQUIRED - warning escalation
Warning state is visibly stronger than normal without making routine variation look catastrophic.

### I6 REQUIRED - calm normal state
Normal state avoids excessive warning color/noise.

### I7 REQUIRED - journey screenshot set
Screenshots exist for the required storyboard, not merely isolated hero shots.

### I8 REQUIRED - connected visual audit
VISUAL_AUDIT.md evaluates transitions/journey, not only individual frames.

### I9 REQUIRED - P0 defects
Unresolved P0 count = 0.

### I10 REQUIRED - P1 defects
Unresolved P1 count = 0.

### I11 REQUIRED - final screenshots freshness
Final screenshots were regenerated after the last meaningful UI/layout change.

## J. Performance and operational behavior

### J1 REQUIRED - no obvious runaway rendering
Live updates do not cause visible full-screen flicker, uncontrolled DOM growth, or continuously multiplying subscriptions.

### J2 REQUIRED - history bounded
Demo/live history storage is reasonably bounded for the prototype.

### J3 REQUIRED - repeated connect/disconnect
Mock lifecycle can repeat connection/disconnection without duplicate notification behavior or duplicated events.

### J4 REQUIRED - demo works offline
Core deterministic demo remains usable without external cloud APIs.

## K. Documentation and handoff

### K1 REQUIRED - README current
Root README describes current architecture and commands, not obsolete prototype-only instructions.

### K2 REQUIRED - morning runbook
MORNING_RUNBOOK.md exists and is short/actionable.

### K3 REQUIRED - wiring truth
Wiring doc includes MQ-135 ADC voltage warning and exact planned pins.

### K4 REQUIRED - install/flash commands
Morning runbook contains exact firmware build/flash/serial and APK install/open steps.

### K5 REQUIRED - demo procedure
Morning runbook has normal -> safe warm-air excursion -> warning -> history -> recovery demo flow.

### K6 REQUIRED - fallback
Morning runbook includes:
- one-sensor failure;
- BLE failure;
- physical hardware failure -> deterministic software demo fallback.

## L. Final audit

### L1 REQUIRED - full regression after last meaningful change
Build/test/QA gates relevant to changed areas are rerun.

### L2 REQUIRED - final status truthful
FINAL_STATUS.json contains no PASS without evidence.

### L3 REQUIRED - no unresolved non-physical blocker
RUN_STATE.md contains no unresolved blocker that could reasonably have been handled overnight.

### L4 REQUIRED - final audit report
qa/reports/FINAL_AUDIT.md summarizes evidence, remaining physical tasks, and exact APK/firmware artifacts.

Only after L1-L4 and all other REQUIRED gates are PASS may the Goal be marked complete.

## M. ColdTrace Edge integration acceptance (additional gates)

These criteria add to the existing gates and do not replace or weaken them.

### M1 REQUIRED — profile and source isolation
ColdLoop 20-byte data cannot reach EDGE-3 inference. A source explicitly reports profile, label, physical/simulated/evaluation status and capabilities. New sessions do not inherit events from a previous source.

### M2 REQUIRED — EDGE-3 transport and protocol
A dedicated profile filters the EDGE-3 service/characteristic UUID and strictly validates the 15-byte little-endian v1 packet, sentinels, temperature range, sensor IDs, duplicates/reordering and wrapping sequence. ColdLoop 20-byte and serial JSON paths stay compatible.

### M3 REQUIRED — immutable local production model
Verified bundle production schema/model are copied and bundled locally with version/checksum evidence. Inference works with network disabled and makes no prediction API request.

### M4 REQUIRED — app-side parity
All 24 production golden vectors match the local reference within plan tolerance inside the integration. S2 vectors stay evaluation-only and cannot enter live or production replay inference.

### M5 REQUIRED — temporal and coverage gates
Ten-minute aligned per-probe aggregation, exact seven-row history, no gap compression/interpolation, distinct-probe coverage, missing-center rejection, sensor/range validation and warm-up conditions match the reference.

### M6 REQUIRED — prediction state and events
Forecast distinguishes hidden/unavailable, building history, paused for gap/coverage, ready/no alert, and ready/model alert. One event is grouped per low-to-high transition and closes on the next valid below-threshold score with source/model/time metadata.

### M7 REQUIRED — replay roles
Presenter normal replay uses the production model and compatible shipment trace. S2 is only available through clearly labelled held-out evaluation replay. Replays enter through the same encoded packet/decoder/aggregation/scoring path as BLE data.

### M8 REQUIRED — persistence and offline restart
Only the bounded last seven valid completed EDGE-3 buckets plus validated source/model metadata persist. Restore rejects stale/discontinuous history. APK cold launch, offline replay through warm-up/result, kill/relaunch and Back are exercised.

### M9 REQUIRED — product and presenter UX
Forecast is compact and progressively disclosed; incompatible ColdLoop sources never show ColdTrace forecasts. Device/settings capabilities, simple presenter controls and hidden QA fixtures are accurate and uncluttered.

### M10 REQUIRED — accessibility and responsive visuals
Dialog focus, reduced motion, text scale, chart text alternative, live announcement, touch targets and contrast are checked. Final journeys are regenerated and reviewed at 360x800, 390x844, 412x915 and desktop; no overflow or unresolved P0/P1 visual defect remains.

### M11 REQUIRED — scientific wording and handoff
Only raw thermal-risk score and model alert wording is used. No safety, probability, confidence, spoilage, shelf-life, expiry-extension or root-cause claims. Final report/status/failure/decision/runbook agree.

### M12 PHYSICAL_REQUIRED — real EDGE-3 radio/sensors
Real BLE discovery, three real distinct sensor positions, radio stability, on-node sensor behavior and serial output require physical hardware.
