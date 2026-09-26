# ColdTrace integration baseline

Date: 2026-09-26 (Asia/Qatar)
Repository: %USERPROFILE%\Documents\ColdLoop
Starting HEAD: e081607504f53e812456c8575939fd4cc7b40ec8
Working branch: master

This baseline captures the existing ColdLoop product before any ColdTrace app-code integration. The starting working tree already contains the completed React/Vite/Capacitor product and its evidence as uncommitted changes. A dedicated local baseline commit was created before further refactoring: 6ee8c19369fdbd0b86805ac171b430e6ff54bbcc.

## Fresh baseline runs

- App unit tests: 5 files / 17 tests passed. Output: qa/reports/coldtrace-baseline-app-tests-20260926.log
- TypeScript and Vite production build: passed; 41 modules transformed. Output: qa/reports/coldtrace-baseline-app-build-20260926.log
- ESP32-C3 hardware firmware: PlatformIO build passed, 1,002,174 bytes flash, 39,036 bytes RAM.
- Wokwi firmware: PlatformIO build passed, 997,110 bytes flash, 39,036 bytes RAM. Combined output: qa/reports/coldtrace-baseline-firmware-build-20260926.log
- Portable ColdTrace bundle: 24 production vectors and 24 S2 evaluation vectors passed; warm-up and timestamp-gap gates passed. Output: qa/reports/coldtrace-baseline-bundle-golden-20260926.log
- Portable ZIP SHA-256: E63D373D7EED87E4E3C9AA1AD50056DCB77B0D8BA72F5BD3BE2F9DB5A5A68DB4, matching the expected e63d373d7eed87e4e3c9aa1ad50056dcb77b0d8ba72f5bd3be2f9db5a5a68db4.

## Existing ColdLoop evidence at baseline

- The current app and APK are the 2026-09-26 reviewed ColdLoop build documented in qa/reports/FINAL_AUDIT.md and qa/FINAL_STATUS.json.
- Prior installed Android run: 24 screenshots / 38 steps, Android 16/API 36 emulator, no WebView runtime exceptions or fatal AndroidRuntime exception.
- Prior responsive web journey: 84 current screenshots at 360x800, 390x844, 412x915, and 1440x1000 showcase; current directory reconciles to its manifest.
- Prior accessibility audit: 13 representative states, zero axe violations, keyboard modal/skip checks; Android text scaling 1.3 was smoke-tested.
- Physical sensor and BLE hardware remain unverified. The prior physical inventory found no ESP32 USB serial device or physical Android device.
- Prior APK SHA-256: F32C81BAEDB531E0879EB2773DFF9AA7FD6BCDDEFEF790F090E0005BCF84F6DB.

## Integration boundary

No ColdTrace code has been added to the app at this point. The local bundle is preserved under ai_bundle as the reference source. The current DHT22/ENS160/MQ-135 20-byte protocol must continue to work and must never be treated as compatible EDGE-3 input.
