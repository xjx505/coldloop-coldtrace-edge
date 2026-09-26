# Publication status — 2026-09-26

## GitHub latest release — verified

- Public repository: https://github.com/xjx505/coldloop-coldtrace-edge — source and current QA evidence are pushed to `main` at commit `91373a7`.
- GitHub Releases marks `v1.0.1-demo` as **Latest**. The `/releases/latest` API returns this tag; the release is published, not a draft and not a prerelease. Release page: https://github.com/xjx505/coldloop-coldtrace-edge/releases/tag/v1.0.1-demo.
- Installable Android APK: https://github.com/xjx505/coldloop-coldtrace-edge/releases/download/v1.0.1-demo/ColdLoop-Android-debug.apk — 6,691,136 bytes; GitHub asset SHA-256 `71113663c66f6fff1f45a7bcaa5b003c4690d4aa26149f6da9591c4cd8a945e0`. The GitHub digest matches the locally tested APK.
- The release also contains hardware and Wokwi ESP32-C3 firmware, the portable model bundle, checksum manifest, and exact user-supplied PNG. GitHub's logo digest is `543af651c1c390d7056fb5b9cda3a14792dd89142925c07aea8cc7a8c1c6afeb`, identical to the original source and live Netlify PNG.

## Netlify production showcase — verified

- Site: https://coldloop-coldtrace-edge.netlify.app
- Attached-design presenter view: https://coldloop-coldtrace-edge.netlify.app/showcase
- Production deploy ID: `6ab7a88e10b8d6bdffd93daa`.
- Both `/` and `/showcase` returned HTTP 200. The deployed JavaScript bundle SHA-256 matches the local Vite output. `/coldloop-logo-source.png` returned the exact 1,000,987-byte supplied PNG; `/favicon.png` returned HTTP 200.
- Evidence: `qa/reports/netlify-deploy-20260926.json` and the current 101-frame connected browser journey.

## Validation boundary

The exact released APK passed emulator install and journey QA: 32 screenshots, 51 steps, zero WebView exceptions and zero external requests. All required non-physical gates pass. Physical sensor behavior and phone-to-node BLE remain `PHYSICAL_REQUIRED`; see `MORNING_RUNBOOK.md` for the precise board/phone action.
