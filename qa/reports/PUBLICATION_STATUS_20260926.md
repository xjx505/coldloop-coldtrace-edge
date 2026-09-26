# Publication status — 2026-09-26

## Netlify production showcase — verified

- Site: https://coldloop-coldtrace-edge.netlify.app
- Attached-design presenter view: https://coldloop-coldtrace-edge.netlify.app/showcase
- Production deploy ID: `6ab7a88e10b8d6bdffd93daa`.
- Both `/` and `/showcase` returned HTTP 200. The deployed JavaScript bundle SHA-256 matches the local Vite output. `/coldloop-logo-source.png` returned the exact 1,000,987-byte supplied PNG with SHA-256 `543AF651C1C390D7056FB5B9CDA3A14792DD89142925C07AEA8CC7A8C1C6AFEB`; `/favicon.png` returned HTTP 200.
- Evidence: `qa/reports/netlify-deploy-20260926.json`; current connected journey screenshots are under `qa/screenshots/web/`.

## GitHub release — candidate verified, publishing now

- Public source: https://github.com/xjx505/coldloop-coldtrace-edge
- Existing latest release remains `v1.0.0-demo` until the new release upload is complete.
- Validated next-release APK: `deliverables/ColdLoop-Android-debug.apk`, 6,691,136 bytes, SHA-256 `71113663c66f6fff1f45a7bcaa5b003c4690d4aa26149f6da9591c4cd8a945e0`.
- The exact candidate APK passed emulator install and journey QA: 32 screenshots, 51 steps, zero WebView exceptions and zero external requests.
- Release assets prepared: Android debug APK, ESP32-C3 hardware and Wokwi firmware, portable ColdTrace model bundle, exact supplied PNG logo, and SHA-256 manifest. Release notes are in `qa/reports/GITHUB_RELEASE_NOTES_1.0.1-demo.md`.
- Physical sensor and phone-to-node BLE checks remain `PHYSICAL_REQUIRED`.
