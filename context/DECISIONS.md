## Current publication decision — 2026-09-26

Publish the current debug APK as the non-prerelease `v1.0.1-demo` latest release, keeping source/evidence in the public `main` branch. Keep the attached product showcase at the existing Netlify site `/showcase`. Use the exact user-supplied PNG as the source mark; keep the original PNG attached and hash-verifiable. Physical sensor/radio claims stay pending until an actual board and handset are exercised.
# Decisions and Rejected Directions

This file prevents rediscovering abandoned ideas after context compaction.

## Product concept decisions

### Keep

ColdLoop is one closed-loop cold-chain decision-support concept, not a pile of unrelated AI features.

The hardware/app MVP demonstrates condition sensing, anomaly/event monitoring, useful history, and a trustworthy operator interface.

The larger story may include prediction/diagnosis/action ranking/fleet learning, but the demo must not fabricate unsupported outputs.

### Reject as primary project

- arbitrary cross-company rerouting;
- changing/extending printed expiry;
- generic dock prioritization as the innovation;
- reefer predictive maintenance as the entire product;
- restaurant demand/overproduction forecasting;
- generic receiving triage;
- dynamic delivery sequencing outside current scope;
- condensation/cold-room optimization as the main story;
- surplus transfer as main story;
- sensor-fault detection as the main innovation;
- a generic fruit freshness detector disconnected from cold-chain operations.

## Hardware decisions

DHT22:
keep for simple T/RH demo.

MQ-135:
keep as cheap relative signal. Do not claim specific gas identity.

ENS160:
user intends to buy/use the more expensive sensor. Treat it as a reusable digital VOC/air-quality channel, not a spoilage oracle.

Do not let gas sensing replace the cold-chain narrative.

## App architecture decision

Target one shared application:
React/Vite/TypeScript + Capacitor Android + BLE plugin + MockTransport + web/showcase.

Reason:
one UI/domain codebase reduces risk and enables real Android package plus presentation surface.

Do not build separate unrelated web and Android apps.

## BLE decision

Use BLE, not Bluetooth Classic.

ESP32 is peripheral; Android app is BLE central.

Preferred plugin:
`@capacitor-community/bluetooth-le` compatible with Capacitor 8.

Preserve existing service/characteristic UUIDs and 20-byte packet unless necessary.

## Active implementation decisions — 2026-09-26

- Keep firmware UUIDs and all 20 telemetry bytes unchanged. Use bit 5 only to report that 30 nonzero MQ ADC readings formed a relative baseline; do not describe that flag as physical warm-up, heater stabilization or gas calibration.
- Decode ENS160 readiness from its raw status, withhold untrusted air values during warm-up/fault, and withhold DHT values when the DHT fault bit is set.
- Use one bounded `ConditionEngine` and one `TelemetryTransport` contract for BLE and deterministic binary mock packets. Keep events/settings in local device storage; cap sample history at 120 and event history at 100.
- Build Android with a user-local JDK 21 and Android SDK because generated Capacitor/Cordova Android sources target Java 21. Do not change the project's Java source level or install the toolchain system-wide.
- Run browser QA on loopback port 4174. Port 4173 belongs to a separate `welcome-app-work` Vite server and is left untouched.
- Treat emulator, screenshots and mock BLE state as software evidence only. Physical GPIO voltage, sensor behavior and phone-to-ESP32 BLE remain explicit morning checks.
- Keep Android and web screenshot evidence tied to a settled render. The Android harness waits for the WebView to appear, waits for two animation frames, captures the emulator surface, then reattaches DevTools after screenshot I/O. The web harness waits two frames and confirms the product header and bottom navigation fit the viewport before saving.
- Show a transport-source chip only when the app has an actual BLE or demo transport. A disconnected no-data screen must not imply readiness by default.
- Preserve this workstation's Android toolchain process-locally: user-local JDK 21 and SDK paths are set only for build commands; do not rely on global environment changes.
- Treat the current serial-port inventory as a physical hardware gap: Bluetooth serial profiles and ACPI COM1 are not an ESP32 USB connection, and `adb devices -l` shows only the emulator.
- Keep the judge-facing showcase concise: Normal, Excursion and Recovery are the primary controls; engineering/failure fixtures are progressive-disclosure content. Both showcase and native app use the same shared ProductApp/controller.
- Render one neutral `Simulated data` source label on Live, and one concise `Simulated` provenance marker on each History/event detail record; avoid repeating demo badges/status copy.
- On a triggered event, round active elapsed duration to nearest whole second. The event rule requires three consecutive high readings spanning at least 1,500 ms; tests pin the boundary at 1,499/1,500 ms so user-facing timing cannot imply a shorter trigger.
- Keep protocol/UUID metadata under expandable Device connection details. Maintain keyboard-accessible dialogs with focus placement/trap, Escape close, inert background and focus return after the dialog is removed.
- Check the Android WebView with larger system text (1.3 scale) and restore the emulator preference afterward; fixed bottom navigation remains available while longer Settings content scrolls.

## Design decisions

Reject:
- dark navy/purple;
- "AI dashboard" aesthetic;
- decorative visuals;
- excessive text;
- emoji UI;
- random gauges/charts.

Prefer:
- light/warm neutral;
- calm default state;
- meaningful green/amber/red;
- progressive disclosure;
- live trend;
- event history;
- sensor health;
- useful settings.

## Navigation

Do not commit blindly to hamburger navigation.

Likely default:
bottom navigation for Live / History / Device, with Settings accessible clearly.

If usability evidence shows a drawer is better, use it.

## Android emulator / BLE decision

Use emulator heavily for:
- install;
- launch;
- navigation;
- responsiveness;
- lifecycle;
- screenshots;
- mock telemetry.

Do not make full virtual BLE-radio simulation a completion dependency.

If current Android Emulator networking supports a practical BLE simulation path, investigate only after core gates are healthy and time-box it.

Physical phone <-> ESP32 BLE remains a morning verification gate unless actually tested.

### 2026-09-26 runtime permission evidence

The final API 36 emulator pass exercises the Android Nearby devices runtime prompt, denial and Settings recovery, grant, and entry into the native BLE picker. A no-peripheral picker result verifies the app returns from cancel without a crash; it does not prove physical discovery, GATT, notifications, or sensor behavior. Keep B9 `PHYSICAL_REQUIRED` and F10 `OPTIONAL` unchanged. Evidence: `qa/reports/android-permissions-20260926.txt` and the referenced screenshots.

## Scientific claims

Never:
- claim exact gas from MQ-135;
- call eCO2 direct CO2;
- call heuristic anomaly "spoilage probability";
- certify food safety;
- extend expiry;
- claim validated shelf life without validation.

## Demo heating

Do not use an aggressive heat gun at close range.

Prefer safe warm air, hair dryer on low at distance, warm object near sensor, or other controlled disturbance.

Warning should tolerate noise rather than trigger from a single reading.

## 2026-09-26 ColdTrace integration Phase 1

- Keep the ColdLoop 20-byte profile separate from EDGE-3; adding session identity does not alter bytes, UUIDs, or serial JSON.
- Tag condition events with the source session and key active rule trackers by session plus event kind so partial history cannot carry across a new source.
- Air/VOC events record the initial trigger basis and both available peaks. Migrated history without trigger basis is explicitly unknown.
- Use one accessible dialog with controller-owned exact opener, document-level focus containment, Escape/Back close, and focus restore after inert state clears.

## Public release scope — 2026-09-26
Published a fresh-history snapshot because the local Git history contains an unrelated raw ChatGPT conversation archive and five third-party source PDFs. The public snapshot omits those materials and the superseded screenshot archive, excludes caches/build outputs/local settings, scrubs workstation paths, and preserves the source index and citations. Model source, model/evaluation artifacts, Apache-2.0 notices, app/firmware source, and current web evidence remain included.


## Latest-release selection — 2026-09-26
GitHub refuses to mark a prerelease as the latest release. The requested demo artifact is therefore published as tag v1.0.0-demo, with the release marked non-prerelease and its notes explicitly describing a debug/demo distribution. This makes GitHub's Latest link resolve to the APK while retaining the demo/debug qualification.
