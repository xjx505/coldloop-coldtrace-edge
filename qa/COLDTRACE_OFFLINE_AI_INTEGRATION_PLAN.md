# ColdTrace Offline AI Integration Plan

STATUS: PLANNING / DISCUSSION ONLY

Do not modify application code from this document until the user explicitly approves the architecture and execution plan.

## Why this exists

ColdLoop currently works as a real Capacitor Android + React/Vite/TypeScript app with:
- native BLE transport;
- deterministic simulation transport;
- condition/event engine;
- local history;
- Android emulator QA;
- DHT22 + ENS160 + MQ-135 firmware/protocol branch.

A separate ColdTrace Edge project now provides a portable trained offline AI bundle.

The objective is to integrate that AI into the real Android app without:
- replacing the working app;
- requiring internet inference;
- faking unsupported hardware inputs;
- mixing evaluation artifacts with production inference;
- weakening the existing BLE/demo reliability;
- turning the app into a broken hackathon-only mock.

## Portable bundle source

Verified local bundle:

`C:\\Users\\xjx50\\Documents\\ColdLoop\\ai_bundle\\coldtrace-android-ai-portable.zip`

Extracted bundle:

`C:\\Users\\xjx50\\Documents\\ColdLoop\\ai_bundle\\coldtrace-android-ai-portable`

Integration guide:

`C:\\Users\\xjx50\\Documents\\ColdLoop\\ai_bundle\\coldtrace-android-ai-portable\\README_INTEGRATION.md`

Local artifact map:

`C:\\Users\\xjx50\\Documents\\ColdLoop\\ai_bundle\\LOCAL_BUNDLE_README.md`

ZIP SHA-256 independently rechecked:

`e63d373d7eed87e4e3c9aa1ad50056dcb77b0d8ba72f5bd3be2f9db5a5a68db4`

Independent bundle test rerun:
- production parity vectors: 24/24 PASS;
- S2 evaluation-only parity vectors: 24/24 PASS;
- warm-up gate: PASS;
- timestamp-gap gate: PASS;
- production threshold: 0.50.

The bundle has not yet been copied into the Windows ColdLoop app and the Android app has not yet been modified for AI.

## What the production AI actually is

It is NOT a language model.

Production artifact:
- model: regularized class-weighted Logistic Regression;
- model version: `coldtrace-edge3-logistic-v1`;
- model JSON size: about 4.2 KB;
- sensor configuration: EDGE-3;
- inputs: Front_Middle, Middle_Middle, Rear_Middle temperatures;
- source cadence: fixed epoch-aligned 10-minute buckets;
- input history: seven chronological rows / 60 minutes;
- target: processed dataset `y_next_120_R2`;
- output: uncalibrated thermal-risk score;
- HIGH threshold: score >= 0.50;
- inference: synchronous local JavaScript math;
- network required for inference: NO;
- GPU / TensorFlow / ONNX / server required: NO.

Do not label the raw score as:
- probability of spoilage;
- food-safety probability;
- confidence percentage;
- shelf-life estimate;
- expiry extension.

## Critical compatibility problem

The current Windows ColdLoop hardware branch is NOT a valid EDGE-3 model input.

Current ColdLoop node:
- one DHT22 temperature/humidity source;
- ENS160;
- MQ-135;
- 20-byte BLE packet.

ColdTrace EDGE-3 expects:
- three distinct physical probe positions:
  - Front_Middle;
  - Middle_Middle;
  - Rear_Middle;
- DS18B20-compatible temperature semantics;
- seven exact 10-minute observations.

Therefore:

DO NOT:
- copy the DHT22 value into all three EDGE-3 positions;
- invent missing probes;
- map humidity/VOC channels into temperature positions;
- run EDGE-3 on one probe and call it valid;
- claim the current 20-byte DHT/ENS/MQ node physically drives the predictive model.

If only the current Windows sensor node is available, it remains a condition-monitoring hardware prototype. The AI must report input unavailable / incompatible rather than fabricate a prediction.

## Recommended integration architecture

Because the current Android app is already React + Vite + TypeScript inside Capacitor, the lowest-risk architecture is:

```
                LOCAL APP
                    |
       +------------+-------------+
       |                          |
Condition monitoring         ColdTrace AI
existing engine              local module
       |                          |
BLE / deterministic          EDGE-3 observation buffer
transport                    10-min bucketizer
       |                          |
existing 20-byte node        7-row validity gate
and demo                     feature extraction
                                  |
                            bundled 4.2 KB model
                                  |
                           local risk result
```

The model should live in the shared WebView/TypeScript layer, NOT in a cloud service and NOT in a separate Android application.

Native Kotlin inference is unnecessary unless the existing WebView path proves unreliable. A Kotlin port creates another parity surface for no clear benefit.

## Recommended implementation method

After approval:

1. Copy the verified portable bundle into the ColdLoop repository under a clearly isolated source/vendor folder.
2. Preserve the original bundle and checksum as immutable reference evidence.
3. Integrate the production feature/scoring code into `app/src/ai/`.
4. Prefer an exact TypeScript port/wrapper of the tiny JavaScript math rather than rewriting the algorithm creatively.
5. Bundle the production model JSON into the app at build time so first-launch offline inference does not depend on network or cache.
6. Add the 24 production parity vectors to the app test suite.
7. Require app-side score parity against the portable bundle before exposing any AI UI.
8. Keep `evaluation_only/` isolated from normal production inference.
9. Keep calibration and Quality-Life optional and visually/semantically separate.

## Offline requirement

"Offline" means more than "the API usually works without Wi-Fi."

The final Android APK must contain:
- inference code;
- production model parameters;
- feature schema;
- required UI logic.

AI scoring must make zero network requests.

Acceptance test:
1. install APK;
2. launch once or cold-launch while network is disabled;
3. feed compatible replay/local data;
4. reach MODEL WARM-UP;
5. reach READY after seven valid 10-minute rows;
6. produce the expected score/tier;
7. inspect network log;
8. confirm no prediction/backend request occurred.

Cloud sync may exist separately, but network loss must never disable local inference.

## Data-path design

### Production EDGE-3 path

Raw compatible three-probe packets
-> validate each probe (-55..125 °C)
-> keep invalid/missing values as null
-> fixed epoch-aligned 10-minute averaging
-> preserve missing buckets
-> retain seven chronological rows
-> exact cadence/gap gate
-> EDGE-3 coverage gate
-> feature extraction
-> stored imputation/scaling
-> logistic score
-> HIGH/LOW using model threshold
-> local UI + local event record

### Model warm-up

The UI must NOT display LOW merely because there is insufficient history.

States should be explicit:
- Waiting for compatible probes
- Building 60-minute history
- History gap detected
- Sensor coverage degraded
- Model ready
- HIGH thermal-risk state
- LOW thermal-risk state

Warm-up/degraded states are product states, not errors.

## Demo/replay design

A judge cannot wait 60 real minutes for the model to warm up.

Therefore predictive-AI demonstration should use a clearly labelled accelerated replay path.

Keep two concepts separate:

### A. Condition-monitoring fallback
Existing deterministic ColdLoop demo:
- normal;
- excursion;
- warning;
- event;
- recovery.

This proves app/event behavior if ESP32/BLE fails.

### B. AI evaluation replay
ColdTrace replay:
- recorded three-probe shipment observations;
- accelerated 10-minute chronology;
- same production feature code;
- evaluation-only S2 model only when demonstrating held-out S2 evidence;
- clearly labelled "Accelerated held-out shipment replay" or equivalent.

Do not present accelerated replay as a live physical 60-minute observation.

Normal product inference must use the all-six production model, not the S2 evaluation model.

## Production vs evaluation artifact firewall

Production:
`model/edge_model.json`

Normal app inference must load this model only.

Evaluation-only:
`evaluation_only/edge_model_s2_loso.json`

May be used only in an explicitly labelled S2 held-out judge replay/evaluation mode.

There must be no code path where normal live inference silently loads the S2 artifact.

Add a test that fails if normal inference modelVersion equals the S2 evaluation model version.

## UI recommendation

Do not turn Live into another dashboard full of cards.

Add predictive information only when it has a clear user purpose.

Possible hierarchy:

Live:
- current condition monitoring remains primary;
- one concise predictive-risk row/card appears only when a compatible EDGE-3 stream/replay exists.

Predictive state examples:
- "Building prediction history · 40 / 60 min"
- "Thermal risk · LOW"
- "Thermal risk · HIGH"
- "Input degraded · prediction paused"

Detail view may show:
- model state;
- raw thermal-risk score labelled as score, not probability;
- seven-window input coverage;
- three probe values/trends;
- model version;
- why scoring is unavailable;
- human-review wording.

Do not expose twenty-two model features to ordinary users.

## Source identity

The app must visibly distinguish:
- BLE physical data;
- deterministic condition demo;
- accelerated AI replay.

Do not repeat the disclosure three times on one screen.

One persistent source indicator plus appropriate History/event source metadata is enough.

## Event/source isolation requirement

Current ColdLoop transport switching clears samples but can leave active condition-event trackers alive.

Before adding AI, fix source isolation:
- a BLE event must not be recovered/modified by Demo data;
- a Demo event must not be modified by BLE data;
- AI replay events must remain separate from live physical events;
- switching source should interrupt/finalize active events from the previous source or maintain separate engines.

This is mandatory for credible fallback behavior.

## Deep-review fixes required alongside integration

### P1
1. Fix temperature card state semantics: Air/VOC or ENS state must not make a normal temperature card say "Watch".
2. Fix modal accessibility: move focus into dialogs, trap/tab correctly, restore focus on close, prevent underlying controls from being tabbable while modal is open, support Escape on web where appropriate.
3. Replace default Capacitor Android launcher/splash branding; replace the zero-byte web favicon.
4. Fix transport-source event contamination.
5. Fix Air/VOC event threshold semantics so AQI-triggered events do not falsely display 700 ppb as the sole breached threshold.
6. Keep ColdLoop/ColdTrace product story consistent. Do not imply the current DHT22/ENS160/MQ-135 node is EDGE-3.

### P2
7. Simplify demo labeling to one persistent simulated-data indicator.
8. Presenter mode: Normal / Excursion / Recovery by default; hide engineering fault scenarios under Advanced.
9. Increase meaningful 8-10px text to a more readable scale where layout allows.
10. Move "20-byte packed little-endian" and similar protocol details into technical disclosure.
11. Clean Settings hierarchy.
12. Add subtle purposeful motion only if it survives reduced-motion and visual QA.

## Accessibility acceptance

Accessibility is implementation, not a badge.

Required:
- statuses understandable without color;
- meaningful contrast;
- >=44px primary touch targets;
- accessible names for icon-only controls;
- correct modal keyboard behavior;
- focus restoration;
- useful chart text alternative / state summary;
- reduced-motion respected;
- larger-text/layout stress test;
- no clipped primary action under scaling.

Do not claim broad accessibility compliance unless actually audited against a named standard.

## Testing plan

### AI math
- original portable Node golden test remains PASS;
- app integration passes all 24 production parity vectors;
- score error tolerance explicitly documented;
- warm-up test;
- exact 10-minute gap test;
- null probe test;
- out-of-range test;
- degraded spatial-coverage test;
- threshold boundary test.

### Offline
- cold launch with network disabled;
- no inference network request;
- model present inside APK/web bundle;
- scoring works from local assets only.

### Model-role
- normal mode loads all-six model;
- S2 model accessible only in evaluation replay;
- app visibly labels evaluation replay.

### UX
- no model output before valid history;
- source mode always clear;
- HIGH/LOW never styled as food-safe/unsafe;
- no "probability" wording for raw score;
- no false expiry/shelf-life language.

### Integration regression
- existing 14+ app/domain/BLE tests remain PASS;
- existing condition demo remains deterministic;
- Android build/install/launch remains PASS;
- BLE permission/scanner paths remain PASS;
- web and Android screenshot journeys regenerated after final UI change.

## Stop conditions / user discussion gate

Before implementation, the AI must discuss with the user:
1. final product naming: ColdLoop vs ColdTrace Edge presentation relationship;
2. whether predictive UI belongs directly on Live or in a separate "Risk" detail/surface;
3. whether S2 accelerated replay will be visible in the normal app, presenter-only mode, or both;
4. whether the current DHT22/ENS160/MQ-135 branch remains in the judged demo;
5. whether a three-DS18B20 ESP32-C3 node is actually planned for physical use.

Until those are agreed, do not modify application behavior or UI for the AI integration.

## Definition of done after approval

AI integration is not done because a model file exists.

It is done only when:
- production model is bundled locally;
- all app-side parity tests pass;
- offline inference is directly verified;
- compatible-input gating works;
- incompatible one-probe hardware cannot produce fake EDGE-3 predictions;
- source isolation is fixed;
- production/evaluation model roles cannot be confused;
- Android app builds and runs;
- deterministic fallback still works;
- accelerated AI replay works and is clearly labelled;
- visual/accessibility QA is rerun;
- no unsupported scientific claim appears in UI;
- final screenshots and evidence are generated after the final meaningful change.
