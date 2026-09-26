# Final software acceptance audit — 2026-09-26

Status: all required non-physical gates pass. Physical sensor and phone-to-node BLE checks remain `PHYSICAL_REQUIRED`; see the morning runbook. The QA ledger is `qa/FINAL_STATUS.json`.

## Current release and deployment

- GitHub latest stable demo release: https://github.com/xjx505/coldloop-coldtrace-edge/releases/tag/v1.0.1-demo
- Installable Android debug APK: https://github.com/xjx505/coldloop-coldtrace-edge/releases/download/v1.0.1-demo/ColdLoop-Android-debug.apk — 6,691,136 bytes, SHA-256 `71113663c66f6fff1f45a7bcaa5b003c4690d4aa26149f6da9591c4cd8a945e0`.
- Exact supplied PNG logo: `ColdLoop-User-Logo.png`, SHA-256 `543af651c1c390d7056fb5b9cda3a14792dd89142925c07aea8cc7a8c1c6afeb`.
- Netlify production showcase: https://coldloop-coldtrace-edge.netlify.app/showcase — deploy `6ab7a88e10b8d6bdffd93daa`. Root and `/showcase` returned HTTP 200. The deployed JavaScript bundle matches the locally built bundle, and the deployed source PNG matches the user's supplied file byte for byte; see `qa/reports/netlify-deploy-20260926.json`.

## Software verification

- Unit suite: 13 files, 53 tests passed; `qa/reports/unit-tests-final-20260926.txt`.
- Android: the exact release APK was installed on API 36 `emulator-5554`; `qa/reports/android-journey.json` is PASS with 32 screenshots, 51 steps, zero WebView exceptions and zero external requests. It covers launch, navigation, Back, warning/recovery/history, device and settings, errors, background/foreground, cold restart, offline S3 replay, persistence, and 130% Android text scale. The harness restores connectivity and text scale after the run.
- Web/showcase: `qa/reports/web-journey.json` is PASS with 101 journey screenshots at 360x800, 390x844, 412x915 and 1440x1000. All four viewports report no page or console errors or horizontal overflow.
- Accessibility: `qa/reports/ACCESSIBILITY_AUDIT.md` records 18 states and zero axe violations, keyboard/dialog focus checks, reduced motion, live status announcement and chart alternatives. Three color-contrast nodes across two dialog states are axe-incomplete; checked CSS token/background combinations exceed 5:1 and are documented in the audit.
- ColdTrace portable parity: `qa/reports/coldtrace-golden-runner-final-20260926.txt` passes 24 production vectors, 24 S2 evaluation vectors and warm-up/gap guards. The packaged model bundle checksum is recorded in `qa/reports/RELEASE_SHA256SUMS_20260926.txt`.
- Firmware: `qa/reports/firmware-final-build-20260926.txt` records successful `hardware` and `wokwi` builds. Protocol fixture, decoder, BLE transport, reconnection, source isolation and persistence tests are part of the full 53-test suite.
- Visual review: `qa/reports/VISUAL_AUDIT.md` records connected user journeys, current screenshot manifests, reviewed Android 130% settings, and zero unresolved P0/P1 findings. The attached S3 warming screenshot is `qa/screenshots/web/1440x1000-showcase/10-coldtrace-s3-warming.png`.

## Product and scientific boundaries

ColdLoop's original 20-byte little-endian BLE contract and service/characteristic UUIDs are preserved, and firmware retains its serial JSON path. ColdTrace uses a separate EDGE-3 profile and must not infer from ColdLoop packets. S3 replay is deterministic recorded telemetry, not a live hour-long shipment measurement. The model is experimental, based on six-shipment evaluation, without prospective field validation or external/food-safety validation. Its score is not a spoilage probability. MQ-135 is a broad relative signal; ENS160 eCO2 is an estimate. The product does not certify food safety, identify a gas, confirm spoilage, extend expiry or claim measured food-waste reduction.

## Physical action still required

No physical Android handset or ESP32-C3 serial board was available during this QA run. In the morning, confirm the exact board pin labels and safe MQ-135 10kΩ/20kΩ divider, bring up sensors one at a time while checking serial JSON/readiness, flash the hardware image, then pair a physical Android phone and verify advancing BLE notifications and the safe excursion → warning → history → recovery flow. No emulator result substitutes for this physical check.
