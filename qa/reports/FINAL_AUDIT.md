> Superseded for the public release on 2026-09-26: see PUBLICATION_STATUS_20260926.md and qa/FINAL_STATUS.json for current APK/firmware fingerprints and incomplete gates.

# ColdLoop final audit

Date: 2026-09-26  
Disposition: software demo and required non-physical gates pass; real sensor behavior and phone-to-node BLE remain morning physical checks.

## Acceptance status

`qa/FINAL_STATUS.json` records PASS with evidence for all 72 non-physical REQUIRED gates. B8 (physical sensor behavior) and B9 (physical phone-to-node BLE) remain `PHYSICAL_REQUIRED`. F10 (virtual BLE) remains `OPTIONAL`. The final ledger assertion is saved in `qa/reports/final-gate-assertion-20260926.log`; that script checks ledger consistency/evidence presence, not product behavior.

## Current build and regression evidence

- `qa/reports/firmware-final-build-20260926.log`: fresh PlatformIO builds for `hardware` and `wokwi` both succeeded. Hardware uses 1,002,174 bytes flash and 39,036 bytes RAM; Wokwi uses 997,110 bytes flash and 39,036 bytes RAM.
- `qa/reports/unit-tests-final-20260926.log`: Vitest passed all 5 files / 17 tests, including protocol fixtures, transport cleanup/reconnect, deterministic event recovery and the 1,499/1,500 ms trigger boundary.
- `qa/reports/android-final-build-20260926.log`: `npm run android:debug` passed with process-scoped Temurin JDK 21 and the user-local Android SDK documented in `MORNING_RUNBOOK.md`. The APK was rebuilt from the final Vite bundle and Capacitor sync. The default shell Java was a runtime-only JRE; no system-wide toolchain setting was changed.
- `qa/reports/web-journey.json`: 84 screenshots, PASS at 360x800, 390x844, 412x915 and 1440x1000 `/showcase`; zero failures, page errors, console errors or horizontal overflow. The journey verifies normal → rising → warning → one active event → recovery → preserved History after stopping, plus device health, Settings, persistence and connection/sensor failure states.
- The current web screenshot directory matches the 84-frame manifest exactly. Twenty-four superseded/unreferenced frames were preserved outside it in `qa/screenshots/archive/superseded-web-20260926/`; the older showcase image with repeated Demo labels is explicitly excluded from current evidence. The current desktop warning frame is qa/screenshots/web/1440x1000-showcase/03-showcase-warning.png.
- `qa/reports/android-journey.json`: current APK installed and exercised on Android 16/API 36 `emulator-5554`; PASS with 24 screenshots, 38 steps, zero WebView exceptions and no fatal AndroidRuntime exception. It includes touch input, primary navigation, metric/event details, threshold warning/recovery, Device/Settings, Back, background/foreground, force-stop/relaunch and persisted Settings/History.
- `qa/reports/ACCESSIBILITY_AUDIT.md` and `accessibility-20260926.json`: 13 web/showcase states, zero axe violations, skip-link and modal keyboard/focus checks. Three color-contrast nodes are disclosed as axe-incomplete due to overlap; manual CSS-token contrast checks record 5.24:1 or higher. Android text-scale screenshots at 130% are `qa/screenshots/android/21-font-scale-130-live.png` through `23-font-scale-130-settings-scroll.png`; emulator scale was restored to 1.0.

The unit and web reports were regenerated from the same final source as the APK. The Android report then installed and exercised the rebuilt APK. The corrected active-event display rounds elapsed seconds to nearest second so a triggered 1.5-second event does not display `1s`.

## Protocol, BLE and scientific truth

`firmware/include/config.h` statically asserts a packed 20-byte `TelemetryPacket`. Firmware and `app/src/transport/BleTransport.ts` use the same service UUID `6d6f0001-7c62-4f44-a4d2-0c5a9b2bca01` and telemetry UUID `6d6f0002-7c62-4f44-a4d2-0c5a9b2bca01`. Golden packet fixtures cover normal, warming, temperature, air/VOC, combined warning, DHT fault, ENS fault and malformed/short packets. Firmware continues to emit human-readable serial JSON.

The APK manifest evidence and separate API 36 permission/scanner exercise are recorded in `qa/reports/android-permissions-20260926.txt`, including denial, Settings recovery, grant, BLE picker and no-device cancellation. This verifies Android permission and scanner-entry behavior on an emulator. Native transport tests cover UUID filtering, one notification subscription, cleanup/reconnect, Bluetooth/permission/connect/timeout/GATT errors. No physical discovery or GATT connection is claimed.

Scientific limits remain explicit: MQ-135 is a broad relative response, ENS160 eCO2 is an estimate rather than a direct CO2 measurement, and the app does not certify food safety, predict spoilage/shelf life, or alter printed expiry.

## Artifact identity

| Artifact | Path | Size | SHA-256 |
|---|---|---:|---|
| Android debug APK, `com.coldloop.monitor` v1.0 (code 1) | `app/android/app/build/outputs/apk/debug/app-debug.apk` | 4,313,167 bytes | `F32C81BAEDB531E0879EB2773DFF9AA7FD6BCDDEFEF790F090E0005BCF84F6DB` |
| ESP32-C3 hardware firmware | `firmware/.pio/build/hardware/firmware.bin` | 1,031,872 bytes | `1DD84BF5D001608CA8E7F97C4D1893D8E6D6EB51D466B7FB78F925C1B47D0378` |
| Wokwi firmware | `firmware/.pio/build/wokwi/firmware.bin` | 1,026,496 bytes | `387FC9F8E34ECB45E7A6E0FA21994CCB738A7F3D1ADAED1323A11BEA3D47D83E` |

## Physical validation boundary and morning action

`qa/reports/physical-inventory-20260926.txt` records only the Android emulator and no ESP32 USB serial device or physical Android phone. Therefore B8/B9 are not software-testable tonight.

Follow `MORNING_RUNBOOK.md`: verify C3 pin labels; check MQ-135 AOUT divider voltage before GPIO connection; bring DHT22, ENS160 and MQ-135 up individually; confirm finite readings/readiness and serial JSON; flash the hardware target; verify `ColdLoop-01` advertising and changing phone notifications; then perform a safe warm-air warning, History and recovery demonstration. If the hardware or radio is unavailable, present the clearly labelled offline simulation fallback.

No unresolved non-physical gate remains. Do not describe physical BLE or sensor behavior as verified until the physical procedure succeeds.
