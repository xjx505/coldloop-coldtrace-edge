# ColdTrace Phase 1 — P1 stabilization

Date: 2026-09-26 (Asia/Qatar)
Project: <LOCAL_USER_PATH>\Documents\ColdLoop
Rollback baseline: 6ee8c19369fdbd0b86805ac171b430e6ff54bbcc

## Defects corrected

- Temperature card status is based on temperature and sensor readiness only; an active air event no longer changes that badge.
- Air events preserve their initial trigger basis (TVOC, AQI, both at trigger, or legacy unknown) plus peak TVOC/AQI. History does not label AQI-only triggers as 700 ppb TVOC.
- Condition rule trackers and event provenance carry a source-session identifier, so unfinished breaches cannot continue across a new session. Existing event records are normalized on load.
- Metric and event detail share AccessibleDialog: initial heading focus, Tab containment, scripted focus containment, Escape/Android Back close, and return to the exact opener after inert state clears.

## Verification

- npm test -- --reporter=dot: 5 files / 19 tests PASS. Includes AQI-only provenance and cross-session unfinished-breach isolation. See coldtrace-phase1-app-tests-20260926.txt.
- npm run build: TypeScript and Vite production build PASS (42 modules). See coldtrace-phase1-app-build-20260926.txt.
- npm run qa:a11y: 13 representative UI states PASS with axe; the script exercises focus loop, Escape close and trigger-focus return. See coldtrace-phase1-accessibility-20260926.txt and ACCESSIBILITY_AUDIT.md.
- Existing ColdLoop packet format and BLE UUIDs are unchanged.

## Remaining

Phase 1 is complete. EDGE-3 source profiles, 15-byte decoding, local model parity and offline replay acceptance remain unimplemented.
