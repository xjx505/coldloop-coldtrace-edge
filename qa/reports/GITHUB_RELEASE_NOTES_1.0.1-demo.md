# ColdLoop + ColdTrace Edge v1.0.1 Demo

This is the current installable Android debug APK and companion demo assets. The Android app branding and the website use PNG assets derived from the exact logo PNG supplied for ColdLoop.

## Validation

- Unit suite: 53 tests passed.
- Android emulator: this exact APK installed and exercised; 32 screenshots and 51 journey steps passed with zero WebView exceptions and zero external requests. The run covers navigation, Back, failure states, offline replay, background/foreground, restart and 130% text scale.
- Web/showcase: 101 journey screenshots passed at 360x800, 390x844, 412x915 and 1440x1000, with no page or console errors.
- Accessibility: 18 audited states, zero axe violations; reduced-motion and chart text alternatives pass.
- ESP32-C3 hardware and Wokwi firmware builds passed. The portable ColdTrace runner passed 24 production vectors, 24 S2 evaluation vectors, warm-up and gap guards.
- Public source: https://github.com/xjx505/coldloop-coldtrace-edge.
- Live presenter showcase: https://coldloop-coldtrace-edge.netlify.app/showcase.

## Assets

- `ColdLoop-Android-debug.apk` — installable sideloaded Android debug build, package `com.coldloop.monitor`; SHA-256 `71113663c66f6fff1f45a7bcaa5b003c4690d4aa26149f6da9591c4cd8a945e0`.
- `ColdLoop-ESP32-C3-hardware.bin` — ESP32-C3 hardware firmware.
- `ColdLoop-ESP32-C3-wokwi.bin` — Wokwi firmware.
- `coldtrace-android-ai-portable.zip` — local model/inference bundle and disclosures.
- `ColdLoop-User-Logo.png` — exact supplied PNG; SHA-256 `543af651c1c390d7056fb5b9cda3a14792dd89142925c07aea8cc7a8c1c6afeb`.
- `ColdLoop-release-sha256.txt` — artifact checksums.

## Limits

This is a debug/demo distribution, not a production-certified product. Physical sensor response and physical Android-to-ESP32 BLE discovery/notifications remain `PHYSICAL_REQUIRED`; emulator/mock/replay evidence does not satisfy those physical checks. ColdTrace is experimental: its score is not a spoilage probability or food-safety finding. Do not use it to accept food, estimate shelf life, change expiry dates or control refrigeration.
