# ColdTrace Edge integration progress

Execution authority: `qa/COLDTRACE_AI_MASTER_EXECUTION_PLAN.md`
Last updated: 2026-09-26 after exact-APK Android run, web journey, accessibility, firmware/model verification and Netlify deployment.

| Phase | Work | Status | Evidence |
|---|---|---|---|
| 0 | Verify local bundle and baseline; preserve rollback point | PASS | `qa/reports/COLDTRACE_BASELINE_20260926.md`; rollback baseline `6ee8c19369fdbd0b86805ac171b430e6ff54bbcc` |
| 1 | Stabilize existing ColdLoop P1 correctness defects | PASS | `qa/reports/coldtrace-phase1-app-tests-20260926.txt`; full suite now 53 tests |
| 2 | Source sessions, capabilities and isolation | PASS | `app/src/domain/source.ts`; `app/src/state/AppController.test.ts`; full unit report |
| 3 | EDGE-3 BLE profile and exact 15-byte decoding | PASS | `app/src/domain/edge3Protocol.ts`, decoder tests, BLE UUID/profile tests; legacy 20-byte fixtures remain |
| 4 | Bundle production AI implementation/model locally | PASS | portable bundle and manifest; `qa/reports/RELEASE_SHA256SUMS_20260926.txt` |
| 5 | App-side production parity | PASS | 24 production plus 24 S2 vectors; `qa/reports/coldtrace-golden-runner-final-20260926.txt` |
| 6 | Ten-minute aggregation, seven-row window and coverage gates | PASS | `app/src/ai/` tests cover cadence, gaps, coverage, missing probes and temperature bounds |
| 7 | Prediction states, model-role firewall and event policy | PASS | `app/src/ai/` and prediction tests; S2 is evaluation-only |
| 8 | Safe persistence and restart validation | PASS | `app/src/ai/coldTracePersistence.test.ts`; Android cold-relaunch journey |
| 9 | Normal production shipment replay | PASS | `app/src/transport/Edge3ReplayTransport.test.ts`; Android offline S3 replay |
| 10 | S2 held-out evaluation replay isolation | PASS | golden runner and web/showcase S2 evaluation screenshots |
| 11 | Forecast UI and detail | PASS | web/Android S3 warming/ready screenshots; accessibility audit |
| 12 | Forecast events/history provenance | PASS | controller/history tests and connected web/Android journeys |
| 13 | Presenter/showcase controls and hierarchy | PASS | 1440x1000 showcase screenshots and 101-frame web journey |
| 14 | Accessibility, branding, settings/device hierarchy and claim review | PASS | exact supplied PNG hashes, 18-state audit, 130% Android screenshots and `qa/reports/VISUAL_AUDIT.md` |
| 15 | Android offline acceptance and final visual/interaction QA | PASS | `qa/reports/android-journey.json`: 32 screenshots, 51 steps, zero exceptions/external requests; web: 101 screenshots |
| 16 | Final evidence, status ledger, release and runbook | PASS | `qa/FINAL_STATUS.json`, `qa/reports/FINAL_AUDIT.md`, `MORNING_RUNBOOK.md`, GitHub v1.0.1-demo, live Netlify showcase |

## Final boundary

All non-physical acceptance work is complete. Only actual sensor response and physical Android-to-ESP32-C3 BLE discovery/notifications remain `PHYSICAL_REQUIRED`; emulator and replay evidence are not substitutes. In the morning, verify board pin labels and the MQ-135 divider, bring up sensors with serial JSON, flash hardware firmware, then verify advancing notifications and the safe warning/history/recovery path on a physical phone. See `MORNING_RUNBOOK.md`.
