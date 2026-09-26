# ColdTrace AI Local Bundle

All files required for ColdTrace Edge integration are stored locally in this ColdLoop project.

## Local root

`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle`

## Portable bundle

ZIP:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\coldtrace-android-ai-portable.zip`

Extracted bundle:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\coldtrace-android-ai-portable`

Integration guide:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\coldtrace-android-ai-portable\README_INTEGRATION.md`

Production model:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\coldtrace-android-ai-portable\model\edge_model.json`

Production parity vectors:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\coldtrace-android-ai-portable\tests\all_six_parity_vectors.json`

Golden test:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\coldtrace-android-ai-portable\tests\run_golden_tests.mjs`

Evaluation-only S2 model:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\coldtrace-android-ai-portable\evaluation_only\edge_model_s2_loso.json`

Evaluation-only S2 parity vectors:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\coldtrace-android-ai-portable\evaluation_only\s2_heldout_parity_vectors.json`

## Exact EDGE-3 reference files

Protocol:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\reference\EDGE3_PROTOCOL.md`

Firmware reference:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\reference\EDGE3_FIRMWARE_MAIN.cpp`

Telemetry / packet / aggregation reference:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\reference\EDGE3_TELEMETRY_REFERENCE.js`

S2 replay trace:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\reference\S2_REPLAY_TRACE.json`

Normal replay trace:
`<LOCAL_USER_PATH>\Documents\ColdLoop\ai_bundle\reference\NORMAL_REPLAY_TRACE.json`

## Integrity

Expected ZIP SHA-256:

`e63d373d7eed87e4e3c9aa1ad50056dcb77b0d8ba72f5bd3be2f9db5a5a68db4`

Local SHA-256 was verified after transfer and matched exactly.

The extracted local bundle was tested with:

`node tests\run_golden_tests.mjs`

Verified result:
- production vectors: 24 PASS;
- evaluation-only S2 vectors: 24 PASS;
- warm-up gate: PASS;
- timestamp-gap gate: PASS;
- threshold: 0.50.

## Rule

Use these local files as the integration source of truth. Do not search for or depend on another machine, remote workspace, cloud inference service, or external copy of the model.
