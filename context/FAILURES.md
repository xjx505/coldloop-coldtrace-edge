## Latest release-candidate verification — 2026-09-26

No non-physical blocker remains. The current APK passed the Android emulator journey; the current web journey and 18-state axe audit passed; 53 unit tests passed; model parity and both firmware builds passed. The Netlify production showcase is live and its deployed bundle and supplied PNG were hash-verified. Remaining checks are physical-only: sensor behavior and BLE notifications with an actual ESP32-C3 and Android handset. See `qa/FINAL_STATUS.json` and `MORNING_RUNBOOK.md`.
# Failure Memory

Record failed approaches here so future turns do not rediscover them.

## 2026-09-25: supervisor control test path mistake

A Codex desktop test was instructed to create:
`%USERPROFILE%\Documents\ColdLoop\SUPERVISOR_TEST.txt`

Codex instead created:
`%USERPROFILE%\Documents\ColdLoop\SUPERVISOR\_TEST.txt`

with correct contents but wrong path, then claimed completion.

Lesson:
an agent's completion statement is not evidence. Exact filesystem/assertion checks are required.

Status:
temporary artifact should be removed during baseline cleanup.

## 2026-09-25: perfect simulation assumption rejected

Earlier framing suggested the sensor system could be simulated close enough that physical connection would be nearly guaranteed.

Correction:
firmware logic, protocol, UI, simulated sensor behavior and failure states can be tested thoroughly, but real MQ-135 chemistry, exact ENS160 response, ADC electrical behavior, wiring quality, power stability and physical BLE radio behavior cannot be perfectly guaranteed by simulation.

Do not reintroduce the "perfect simulation" claim.

## Rejected strategy: build full product around browser Web Bluetooth only

Reason:
user requires a real Android installable app and reliable judge demo. Browser-only Bluetooth is not sufficient as the final product.

Replacement:
native Android via Capacitor + maintained BLE plugin, with shared web/showcase UI.

## Rejected strategy: make virtual BLE radio a mandatory overnight dependency

Reason:
Android emulator BLE capabilities are nuanced/evolving and may become a rabbit hole. It is useful if readily available, but not worth blocking APK/UI/product completion.

Replacement:
MockTransport for deterministic emulator QA + physical BLE verification in morning.

## 2026-09-26: Android build used a JDK below the generated source level

Attempt:
Built the Capacitor Android debug APK with the first user-local JDK installation (Temurin 17.0.20.1).

Evidence:
Gradle reached `:capacitor-android:compileDebugJavaWithJavac` and failed with `error: invalid source release: 21`. The generated Cordova Android plugin build file explicitly sets `sourceCompatibility` and `targetCompatibility` to `JavaVersion.VERSION_21`.

Why it failed:
JDK 17 cannot compile Java 21 sources; the project/plugin sources themselves had not failed compilation.

Replacement:
Install a user-local Temurin JDK 21, point `JAVA_HOME` at it for the documented Android build, and rebuild. Keep the SDK and app configuration unchanged.

Retry allowed? yes, once with the required JDK 21.

## 2026-09-26: first browser QA run reached another project's Vite server

Attempt:
Started the journey runner on port 4173, then opened that port for the phone QA run.

Evidence:
The browser report recorded repeated 404s and a failed Vite WebSocket; the listening process on `0.0.0.0:4173` was PID 26768 running `%USERPROFILE%\Downloads\welcome-app-work\node_modules\.bin\..\vite\bin\vite.js`. Its page never rendered ColdLoop.

Why it failed:
Port 4173 was already occupied by an unrelated project, so that run did not exercise ColdLoop and is not product evidence.

Replacement:
Use a dedicated strict loopback preview port (4174) and verify the route title and app heading before continuing. The other project's server was left untouched.

Retry allowed? yes, once against the confirmed ColdLoop preview.

## 2026-09-26: Android QA attached before the WebView debug socket was ready

Attempt:
Installed the rebuilt APK and started the emulator journey immediately after the Android process appeared.

Evidence:
The app process started, but the first HTTP request to the forwarded WebView DevTools port failed with `TypeError: fetch failed`; no screenshots were captured in that attempt.

Why it failed:
ADB process start precedes WebView target creation. The QA harness made one immediate DevTools fetch instead of waiting for the WebView socket.

Replacement:
Poll the forwarded DevTools endpoint through its startup window, treating connection refusal as “not ready yet”; continue only once the ColdLoop page target is returned.

Retry allowed? yes, once with readiness polling.

## 2026-09-26: malformed telemetry notice was cleared by demo state ordering

Attempt:
Changed a connected mock transport to the malformed-packet scenario from Settings.

Evidence:
The transport emitted a 19-byte packet and the decoder rejected it, but the Live screen did not retain the notice. The final Playwright journey timed out waiting for “Telemetry packet rejected”.

Why it failed:
`startDemo()` cleared the prior notice after `setScenario()` synchronously emitted the malformed packet and raised the new notice.

Replacement:
Update controller state before switching the connected transport scenario. Added an AppController integration test and verified the malformed notice appears in the browser and APK journeys.

Retry allowed? yes, fixed and verified.

## 2026-09-26: Android build used the default Java and SDK environment

Attempt:
Ran Gradle without the user-local Android toolchain paths in the build process.

Evidence:
The default Java was a runtime-only Java 17 installation and Gradle could not find the Android SDK. The app's generated Android sources target Java 21.

Why it failed:
The build process did not inherit the user-local JDK 21 and Android SDK locations.

Replacement:
Set `JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT` and the process `Path` as shown in `MORNING_RUNBOOK.md`; the debug APK then built without changing system-wide environment settings.

Retry allowed? yes, with the documented user-local toolchain.

## 2026-09-26: direct PlatformIO command was not on PATH

Attempt:
Used `pio device list` from a fresh shell to look for a connected ESP32-C3.

Evidence:
PowerShell reported that `pio` was not recognized. The project build wrapper and `MORNING_RUNBOOK.md` use `%USERPROFILE%\Documents\ColdLoop\.venv\Scripts\pio.exe`.

Why it failed:
PlatformIO is installed in the project virtual environment, not on the shell's global `Path`.

Replacement:
Call `.\.venv\Scripts\pio.exe device list` from the repository root. The current output lists only Bluetooth serial ports and the ACPI COM1 port; it shows no ESP32 USB serial device.

Retry allowed? yes, using the repository-local executable.

## 2026-09-26: BLE fake-timer timeout test rejected before attaching its assertion

Attempt:
Advanced the fake clock before registering the rejected-connect expectation.

Evidence:
Vitest reported an unhandled rejection from the expected GATT timeout.

Why it failed:
The simulated timeout promise rejected before the test attached its rejection handler.

Replacement:
Attach the `rejects` expectation before advancing fake time. That run passed all 14 tests across five files; the final updated regression later passes 17 tests in `qa/reports/unit-tests-final-20260926.txt`.

Retry allowed? yes, corrected and included in the final regression.

## 2026-09-26: emulator screenshot DevTools connection went stale after capture

Attempt:
Reused the same WebView DevTools socket after pulling an Android screenshot from the emulator.

Evidence:
The next protocol command timed out while the ColdLoop app remained responsive on screen.

Why it failed:
The emulator's WebView debug endpoint stopped answering on the existing socket after screenshot I/O.

Replacement:
The Android journey harness opens a fresh forwarded DevTools connection after each screenshot and bounds command/pull retries. That stage's 21-frame journey completed with zero runtime exceptions; the later final polish run contains 24 frames in `qa/reports/android-journey.json`.

Retry allowed? yes, using the fresh-connection path.

## 2026-09-26: disconnected Live screen implied the sensor source was ready

Attempt:
The initial no-data Live state rendered a `READY` source chip even though the node label said “Not connected” and the card said “No readings.”

Evidence:
The full-resolution cold-launch screenshot showed the conflicting state on both web and the Android emulator.

Why it failed:
The source chip used `READY` as a default when there was no BLE or demo transport. That described a state the app had not observed.

Replacement:
Hide the source chip until a BLE or demo transport exists. Add explicit no-chip assertions to the web and Android cold-launch journeys; regenerate both screenshot sets and inspect them.

Retry allowed? yes, fixed and covered by final journeys.

Result:
`qa/reports/web-journey.json` passes all four viewports with the cold-launch assertion; `qa/reports/android-journey.json` passes on the rebuilt APK with the same assertion. Corrected screenshots are `qa/screenshots/web/360x800/01-no-data.png` and `qa/screenshots/android/01-cold-launch.png`.

## 2026-09-26: final APK rebuild inherited a runtime-only Java 17 installation

Attempt:
Ran the final `npm run android:debug` without overriding the shell's default Java path.

Evidence:
Gradle reported that `C:\Program Files\Eclipse Adoptium\jre-17.0.8.101-hotspot` lacks `JAVA_COMPILER`.

Why it failed:
The inherited install is a JRE, so it cannot compile Capacitor's Java sources.

Replacement:
Use the already installed user-local Temurin JDK 21 and Android SDK in process-scoped `JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT` and `Path`, as documented in `MORNING_RUNBOOK.md`. The final build succeeds in `qa/reports/android-final-build-20260926.txt`; no global environment was changed.

Retry allowed? yes, with the documented JDK 21 environment.

## 2026-09-26: Android journey treated pidof launch/stop races as command failures

Attempt:
The first current APK journey stopped before its first screenshot, and a retry stopped after foreground capture, during force-stop/relaunch.

Evidence:
ADB showed the package installed and `ActivityTaskManager` displayed `MainActivity`; process absence during a transition returned normal `pidof` exit code 1. The earlier attempt captured no frames; the next reached 22 frames before the restart wait.

Why it failed:
`execFile` treated the expected no-process-yet result as an exception, so the polling predicate could not retry.

Replacement:
Centralize process lookup in `appPid()` and convert transient `pidof` nonzero status to an empty readiness result. The final APK run passes with 24 screenshots, 38 steps and zero runtime exceptions in `qa/reports/android-journey.json`.

Retry allowed? yes, after the readiness probe was corrected.

## 2026-09-26: warning duration rounded below the configured threshold

Attempt:
Reviewed the final warning screenshot against Settings' three-reading/1.5-second alert rule.

Evidence:
An active warning could render `1s` immediately after the engine's 1,500 ms minimum had elapsed because the UI rounded elapsed duration down.

Why it failed:
The event trigger was correct, but flooring a near-2-second active duration made the user-facing copy appear to contradict the trigger rule.

Replacement:
Round displayed duration to the nearest second. Add a boundary test proving no event at 1,499 ms and one at 1,500 ms. Regenerate web and APK screenshot journeys; the final warning frame shows `2s`.

Retry allowed? yes, corrected and covered by the current 17-test run and final web/Android journeys.

## 2026-09-26: PlatformIO build started above the firmware project directory

Attempt:
Invoked `pio run -e hardware -e wokwi` from the repository root.

Evidence:
PlatformIO returned `NotPlatformIOProjectError` because `platformio.ini` is under `firmware/`.

Why it failed:
The CLI needs the firmware project directory (or an explicit `-d firmware`).

Replacement:
Run `..\.venv\Scripts\pio.exe run -e hardware -e wokwi` from `firmware/`. The fresh final dual-target build passes in `qa/reports/firmware-final-build-20260926.txt`.

Retry allowed? yes, from the firmware project directory.

## Template for future failures

### YYYY-MM-DD: short title
Attempt:
Evidence:
Why it failed:
Replacement:
Retry allowed? yes/no/only-if-new-evidence





## 2026-09-26: Phase 1 compatibility check during ColdTrace work

First TypeScript build caught the legacy event loader comparing the narrowed new metric type with the old serialized tvoc value. The loader now explicitly string-checks the old field while converting saved air records to unknown trigger basis.

Status: fixed. Final phase 1 test/build/accessibility outputs are recorded in qa/reports/coldtrace-phase1-*.txt.

## 2026-09-26 public release evidence
The final Android QA attempt used an older APK and failed at a stale ColdTrace selector. The selector was corrected, but the user requested skipping further test runs for the deadline, so the current 4,767,382-byte APK build was not installed or journey-tested. See qa/reports/PUBLICATION_STATUS_20260926.md.


### 2026-09-26: gh release view does not expose isLatest in its JSON fields
Attempt:
Requested isLatest from gh release view --json while verifying the newly published release.
Evidence:
GitHub CLI returned Unknown JSON field: isLatest and listed supported fields; the release itself remained published.
Replacement:
Used gh release list --json isLatest,... and queried GitHub's /releases/latest API endpoint. Both resolved to v1.0.0-demo; gh release view verified uploaded APK and PNG assets.
Retry allowed? yes, through supported release-list/API surfaces; do not repeat the unsupported field request.
