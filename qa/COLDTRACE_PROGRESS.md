# ColdTrace Edge integration progress

Execution authority: qa/COLDTRACE_AI_MASTER_EXECUTION_PLAN.md  
Project root: <LOCAL_USER_PATH>\Documents\ColdLoop  
Updated: 2026-09-26, after Phase 1 P1 fixes and full app/a11y verification.

| Phase | Work | Status |
|---|---|---|
| 0 | Verify local bundle and baseline; preserve rollback point | PASS — rollback commit 6ee8c19369fdbd0b86805ac171b430e6ff54bbcc created after app, firmware and bundle baseline checks |
| 1 | Stabilize existing P1 correctness defects | PASS — temperature status, AQI/TVOC event semantics, per-session event trackers and reusable dialog focus handling fixed; 19 app tests, production build and 13-state axe audit PASS |
| 2 | Source sessions, capabilities and isolation | IN PROGRESS — ColdLoop event sessions are tagged; app-level source profile/capability state and EDGE-3 transport profile remain |
| 3 | EDGE-3 BLE profile and exact 15-byte decoding | PENDING |
| 4 | Copy local production AI implementation/model immutably | PENDING |
| 5 | Pass app-side production parity tests | PENDING |
| 6 | Ten-minute aggregation, seven-row history and coverage gates | PENDING |
| 7 | PredictionEngine states, model-role firewall and event policy | PENDING |
| 8 | Safe persistence and restart validation | PENDING |
| 9 | Normal production shipment replay | PENDING |
| 10 | S2 held-out evaluation replay isolation | PENDING |
| 11 | Forecast UI and detail | PENDING |
| 12 | Forecast events/history provenance | PENDING |
| 13 | Presenter/showcase controls and hierarchy | PENDING |
| 14 | Accessibility, branding, settings/device hierarchy and claim audit | PENDING |
| 15 | Android offline acceptance and final visual/interaction QA | PENDING |
| 16 | Final evidence, status ledger and runbook updates | PENDING |

## Baseline evidence captured before integration

- Bundle ZIP SHA-256 matches the required value; exact result is in qa/reports/COLDTRACE_BASELINE_20260926.md.
- Portable bundle golden runner: 24 production + 24 S2 parity vectors PASS; warm-up and gap guards PASS.
- Existing React/TypeScript/Vite app: 17 tests PASS; TypeScript/Vite production build PASS.
- Existing firmware: hardware and Wokwi targets both build PASS.
- Existing APK/emulator, 84-frame web journey, 13-state accessibility review, and physical inventory are documented in qa/reports/FINAL_AUDIT.md and qa/FINAL_STATUS.json; these are the starting ColdLoop product, not ColdTrace integration evidence.
- No EDGE-3 inference code has been added yet. The existing ColdLoop 20-byte branch remains isolated; Phase 1 fixes only update its event semantics.

## Current checkpoint

- Phase 1 is verified by qa/reports/coldtrace-phase1-app-tests-20260926.txt (5 files / 19 tests), qa/reports/coldtrace-phase1-app-build-20260926.txt (TypeScript/Vite production build), and qa/reports/coldtrace-phase1-accessibility-20260926.txt plus qa/reports/ACCESSIBILITY_AUDIT.md (13 states, axe PASS).
- Air history now preserves AQI-only, TVOC-only, both-at-trigger or legacy-unknown provenance.
- Dialog focus returns to the exact opener, external focus is contained, and Escape/Back share the close path.
- Two regression tests cover AQI-only semantics and unfinished-event isolation across source sessions.
- Next: explicit source profile/capabilities and a dedicated EDGE-3 decoder/transport; ColdLoop 20-byte decoding stays unchanged.
