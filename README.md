# ColdLoop + ColdTrace Edge

![ColdLoop logo based on the supplied PNG](app/public/coldloop-logo.png)

![ColdLoop concept artwork](docs/assets/coldloop-brand-art.png)

ColdLoop is an offline-first cold-chain monitoring demo with an ESP32-C3 sensor node, a native Android app, and a responsive web showcase. Deterministic simulation demonstrates the condition journey without hardware. ColdTrace Edge adds a separate experimental local inference and shipment replay path.

![ColdTrace Edge S3 warming state](qa/screenshots/web/1440x1000-showcase/10-coldtrace-s3-warming.png)

## Project map

- `app/` — React, Vite, TypeScript, Capacitor Android, native BLE, web showcase, deterministic simulation, replay and local inference.
- `firmware/` — ESP32-C3 PlatformIO source, BLE telemetry and serial JSON debug output.
- `ai_bundle/coldtrace-android-ai-portable/` — EDGE-3 model, inference source, feature schema, evaluation artifacts, model card, data card and license.
- `qa/` and `context/` — QA gates, reports, journey screenshots, decisions and known limits.
- `wiring/WIRING.md` and `MORNING_RUNBOOK.md` — setup, flashing and demo steps.
- `app/public/coldloop-logo-source.png` — exact supplied PNG; the app header, launcher, splash and site favicon use PNG assets based on it.

## Web showcase

Run `npm ci` and `npm run dev` from `app/`. The product phone view is available at the Vite URL; the presenter experience is at `/showcase`.

Live showcase: [coldloop-coldtrace-edge.netlify.app/showcase](https://coldloop-coldtrace-edge.netlify.app/showcase)

## Android APK

The latest GitHub release is [v1.0.1-demo](https://github.com/xjx505/coldloop-coldtrace-edge/releases/tag/v1.0.1-demo). Download `ColdLoop-Android-debug.apk` there. It is an installable sideloaded debug build for `com.coldloop.monitor`, not a Play Store-signed package.

APK SHA-256: `71113663c66f6fff1f45a7bcaa5b003c4690d4aa26149f6da9591c4cd8a945e0`.

## ESP32-C3 firmware

Complete firmware source is under `firmware/`; hardware and Wokwi binaries are attached to the GitHub release. Read `wiring/WIRING.md` before connecting sensors. The MQ-135 analog output needs the documented voltage divider before it reaches the ESP32-C3 ADC.

ColdLoop service UUID: `6d6f0001-7c62-4f44-a4d2-0c5a9b2bca01`. Telemetry characteristic: `6d6f0002-7c62-4f44-a4d2-0c5a9b2bca01`. Packets remain 20-byte little-endian values. Firmware also emits serial JSON at 115200 baud.

## ColdTrace Edge model

The JavaScript inference pipeline runs locally. EDGE-3 requires three probe positions and seven completed 10-minute windows with sufficient temperature and spatial coverage. A single-sensor configuration remains in warm-up or configuration-mismatch state. The model target is a processed severe thermal-risk state within 120 minutes; its score is not a probability of spoilage or food-safety risk.

The model card reports six-shipment evaluation. There is no prospective field validation, external calibration, or food-safety validation. Do not use model output to approve food, estimate shelf life, change expiry dates, or control refrigeration. S2 is held-out evaluation only.

## QA and limits

The current source passed 53 unit tests. The exact debug APK was installed and exercised in an Android emulator: 32 screenshots, 51 journey steps, zero WebView exceptions and zero external requests. The web journey captured 101 connected-state screenshots at 360x800, 390x844, 412x915 and 1440x1000 with no page or console errors. The accessibility audit covered 18 states with zero axe violations. Firmware hardware and Wokwi builds and 24 production plus 24 held-out model parity vectors pass.

Physical ESP32-C3 sensors and phone-to-node BLE have not been verified; see `MORNING_RUNBOOK.md` for the exact bring-up steps. MQ-135 is a broad relative signal, ENS160 eCO2 is an estimate, and the software does not identify gases, certify food safety, confirm spoilage, extend expiry or claim measured food-waste reduction. Current gate statuses and evidence are in `qa/FINAL_STATUS.json`.

## License

ColdLoop app and firmware source use Apache-2.0 (`LICENSE`). The ColdTrace model bundle retains its own Apache-2.0 license and data/model disclosures. See `THIRD_PARTY_NOTICES.md`.
