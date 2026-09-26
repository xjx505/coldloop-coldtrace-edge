# Publication checkpoint — 2026-09-26

## Artifacts

- Web: `npm run build` completed for the current React/Vite source. The Netlify upload will use app/dist and includes an SPA fallback for the showcase route.
- Android: the current debug APK was built from the current app source and its manifest/package was available. This exact APK has not been installed and exercised in the emulator after the build; the old Android journey attempt failed on a stale APK and selector. The current APK is therefore a downloadable demo artifact with emulator journey NOT_RUN.
- Firmware: fresh PlatformIO hardware and Wokwi builds completed successfully on 2026-09-26. Both binaries are attached to the GitHub release. Physical board/sensor/phone BLE behavior remains unverified.
- Web visual journey: prior current-source report covers 360x800, 390x844, 412x915 and 1440x1000, with 101 screenshots and no recorded overflow or browser errors.
- Accessibility: axe reported zero violations across 18 states. Color-contrast review was incomplete on three dialog nodes; this is not a full manual WCAG sign-off.
- ColdTrace: source, offline EDGE-3 model, model/data cards, evaluation artifacts, and replay implementation are included. The six-shipment model evidence is not prospective field validation and is not a food-safety or shelf-life claim.

## Artifact fingerprints

- Android APK: 4,767,382 bytes; SHA-256 `58B7A34214610B170F2D3E482D1FC5B6042CE53BF28AAA103ECD67115E2FE88E`.
- Hardware and Wokwi firmware hashes are calculated from the fresh release binaries and recorded in the GitHub release notes.

## Remaining

- Current APK install, launch, navigation, Back, lifecycle and screenshot journey: NOT_RUN after the final APK build.
- Physical sensor/ESP32 BLE: PHYSICAL_REQUIRED.
- Manual contrast review for the noted dialog nodes: incomplete.
- These are reported as incomplete; this publication does not claim all QA gates passed.
