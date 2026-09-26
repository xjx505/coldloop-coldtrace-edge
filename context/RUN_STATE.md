# Run State

Last updated: 2026-09-26, after release-candidate Android, web, accessibility, model and publication verification.

## Current status

`SOFTWARE_ACCEPTANCE_PASS_PHYSICAL_VALIDATION_REQUIRED`

Every required non-physical gate is PASS in `qa/FINAL_STATUS.json`. Physical sensor response and Android-to-ESP32-C3 discovery/notifications remain `PHYSICAL_REQUIRED`; no real hardware check is claimed.

## Current build and publication

- Latest APK: `deliverables/ColdLoop-Android-debug.apk`; 6,691,136 bytes; SHA-256 `71113663c66f6fff1f45a7bcaa5b003c4690d4aa26149f6da9591c4cd8a945e0`.
- Exact APK passed installation and Android 16/API 36 `emulator-5554`: 32 screenshots, 51 steps, zero WebView exceptions, zero external requests. See `qa/reports/android-journey.json`.
- Web journey: `qa/reports/web-journey.json`, PASS with 101 screenshots at 360x800, 390x844, 412x915 and 1440x1000; zero page/console errors and no horizontal overflow.
- Accessibility: 18 states, zero axe violations; keyboard/focus, reduced-motion, live announcement and chart alternatives are recorded in `qa/reports/ACCESSIBILITY_AUDIT.md`.
- App suite: 53/53 tests pass. ESP32-C3 hardware and Wokwi builds pass. Portable model runner passes 24 production and 24 S2 vectors plus warm-up/gap checks.
- GitHub Latest is verified as `v1.0.1-demo` (published, not a draft or prerelease); the release tag targets source commit `91373a7`: `https://github.com/xjx505/coldloop-coldtrace-edge/releases/tag/v1.0.1-demo`.
- Netlify attached-design showcase: `https://coldloop-coldtrace-edge.netlify.app/showcase`; deploy `6ab7a88e10b8d6bdffd93daa`; live route, local bundle hash and exact supplied PNG hash verified in `qa/reports/netlify-deploy-20260926.json`.

## Integration decisions

The ColdLoop service/characteristic UUIDs and 20-byte telemetry contract remain unchanged. EDGE-3 uses its separate profile/15-byte decoder. Simulation and shipment replay are deterministic and offline; gaps remain gaps. Serial JSON remains the firmware debug path. The supplied raster PNG remains the source for app, launcher, splash, favicon and release logo.

## Physical morning action

No physical handset or ESP32-C3 serial board was available. Check board pin labels and divider voltage; start sensors individually while reading serial JSON/readiness; flash the hardware firmware; pair a physical phone; confirm BLE notifications advance; perform a safe excursion → warning → history → recovery path. Detailed commands and fallbacks are in `MORNING_RUNBOOK.md`.
