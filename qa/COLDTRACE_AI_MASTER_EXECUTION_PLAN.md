# ColdLoop + ColdTrace Edge — Master AI Integration Execution Plan

STATUS: APPROVED EXECUTION PLAN
PURPOSE: Integrate the verified ColdTrace EDGE-3 model into the existing ColdLoop Capacitor Android app as a useful, honest, fully offline predictive feature without breaking the working monitoring product.

This is an implementation plan, not a request to redesign the entire application.

---

# 0. Non-negotiable product truth

## Product identity

- **ColdLoop** = the application/platform.
- **ColdTrace Edge** = the predictive thermal-risk module inside ColdLoop.
- Do not randomly rename the entire app to ColdTrace.
- Do not imply the current DHT22/ENS160/MQ-135 hardware is the same thing as the EDGE-3 predictive hardware.

Recommended human-facing framing:

> ColdLoop monitors current cold-chain conditions. ColdTrace Edge looks ahead when compatible three-probe temperature history is available.

## What the AI actually does

The production model:
- regularized class-weighted Logistic Regression;
- model version: `coldtrace-edge3-logistic-v1`;
- bundled model JSON ~4.2 KB;
- trained on six strawberry shipments;
- input configuration: EDGE-3;
- input probes:
  - Front_Middle
  - Middle_Middle
  - Rear_Middle
- seven chronological observations;
- 10-minute cadence;
- 60-minute history;
- target: processed `y_next_120_R2`;
- prediction horizon: next 120 minutes;
- output: raw, uncalibrated thermal-risk score;
- threshold: 0.50.

The raw score is NOT:
- spoilage probability;
- food-safety probability;
- shelf-life estimate;
- expiry extension;
- calibrated confidence percentage.

The model is a **strawberry prototype**. Do not silently generalize it to meat, vaccines, dairy, seafood, medicine, etc.

---

# 1. Verified source artifacts

Verified portable bundle stored locally:

`C:\\Users\\xjx50\\Documents\\ColdLoop\\ai_bundle\\coldtrace-android-ai-portable.zip`

Extracted bundle:

`C:\\Users\\xjx50\\Documents\\ColdLoop\\ai_bundle\\coldtrace-android-ai-portable`

Guide:

`C:\\Users\\xjx50\\Documents\\ColdLoop\\ai_bundle\\coldtrace-android-ai-portable\\README_INTEGRATION.md`

Local artifact map:

`C:\\Users\\xjx50\\Documents\\ColdLoop\\ai_bundle\\LOCAL_BUNDLE_README.md`

Verified ZIP SHA-256:

`e63d373d7eed87e4e3c9aa1ad50056dcb77b0d8ba72f5bd3be2f9db5a5a68db4`

Independent verification already completed:
- 24/24 production parity vectors PASS;
- 24/24 S2 evaluation-only parity vectors PASS;
- warm-up gate PASS;
- timestamp-gap gate PASS.

Production model:
`model/edge_model.json`

Evaluation-only S2 model:
`evaluation_only/edge_model_s2_loso.json`

The S2 artifact must never become the normal production model.

---

# 2. Existing app must remain working

Current ColdLoop app already has:
- React + Vite + TypeScript;
- Capacitor Android;
- native BLE transport;
- deterministic MockTransport;
- Live / History / Device / Settings;
- local history;
- monitoring event engine;
- desktop /showcase route;
- Android emulator QA;
- current 20-byte DHT22/ENS160/MQ-135 BLE path.

Do NOT:
- replace the app with a new app;
- rewrite working screens from scratch;
- replace current monitoring logic with the AI;
- add cloud inference;
- introduce TensorFlow/ONNX/GPU dependencies;
- add a chatbot;
- create a fake separate presentation UI.

---

# 3. First milestone: fix existing P1 correctness issues

Before AI UI is added, fix these defects because the AI integration would amplify them.

## 3.1 Temperature card semantics

Current temperature card can show `Watch` because Air/VOC or ENS state is abnormal.

Fix:
- temperature card status must be temperature-specific;
- Air/VOC state stays in Air/VOC;
- global/system condition, if needed, must be separate.

Add one targeted test.

## 3.2 Source/event contamination

Current transport switching can preserve event trackers across BLE/Demo source changes.

Fix:
- changing telemetry source starts a new source session;
- active events from previous source are finalized/interrupted;
- new source cannot recover or mutate an event created by the old source.

This same mechanism will later isolate AI replay.

Add targeted source-switch tests.

## 3.3 Air/VOC threshold semantics

An event can trigger from TVOC >= 700 OR AQI >= 4, but detail may always imply 700 ppb.

Fix:
- record/display actual trigger semantics;
- never say 700 ppb was crossed if AQI was the actual trigger and TVOC was below it.

Add one targeted test.

## 3.4 Accessible modal/detail behavior

Existing dialogs use `role=dialog aria-modal=true` but underlying controls remain tabbable.

Build one shared accessible detail/dialog primitive or equivalent:
- focus enters dialog;
- underlying UI is inert/not tabbable;
- Tab stays inside;
- Escape closes on web;
- closing restores focus to the control that opened it.

Use this for existing metric/event details and future forecast detail.

Do not build a giant accessibility framework.

## 3.5 Native branding

Replace:
- default Capacitor launcher icon;
- default Capacitor splash;
- zero-byte favicon.

Use simple ColdLoop-branded assets consistent with the existing warm-neutral/green visual language.

No time-consuming brand redesign.

---

# 4. Define source capabilities before model integration

The app must stop assuming every data source can support every feature.

Create a lightweight source/capability model.

Conceptually:

```ts
type SourceKind =
  | 'coldloop-ble'
  | 'coldtrace-edge3-ble'
  | 'condition-demo'
  | 'coldtrace-production-replay'
  | 'coldtrace-evaluation-replay';

type SourceCapabilities = {
  currentTemperature: boolean;
  humidity: boolean;
  airVoc: boolean;
  edge3Forecast: boolean;
  physical: boolean;
  simulated: boolean;
  evaluationOnly: boolean;
};
```

Exact implementation can differ.

Rules:
- one active source session at a time;
- source identity is stored with generated events;
- switching source finalizes old active events;
- predictive AI appears only when `edge3Forecast=true`;
- current ColdLoop 20-byte DHT/ENS/MQ node must never be coerced into EDGE-3.

---

# 5. Support the actual ColdTrace EDGE-3 data contract

The existing ColdLoop protocol and ColdTrace EDGE-3 protocol are different.

## Existing ColdLoop branch
- BLE service: `6d6f0001-7c62-4f44-a4d2-0c5a9b2bca01`
- telemetry characteristic: `6d6f0002-7c62-4f44-a4d2-0c5a9b2bca01`
- 20-byte packet;
- DHT22 + ENS160 + MQ-135.

## ColdTrace EDGE-3 branch
Verified local EDGE-3 protocol reference uses:
- service UUID: `7a4d0001-5fb2-4a4e-9bb9-34afced20001`
- telemetry UUID: `7a4d0002-5fb2-4a4e-9bb9-34afced20001`
- 15-byte packet;
- protocol version;
- sensor ID mapping:
  - 1 = Front_Middle
  - 2 = Middle_Middle
  - 3 = Rear_Middle
- temperature validated to DS18B20 range -55..125 °C.

Port the exact validated contract from `C:\\Users\\xjx50\\Documents\\ColdLoop\\ai_bundle\\reference\\EDGE3_PROTOCOL.md` and `EDGE3_TELEMETRY_REFERENCE.js`. Do not invent a new packet layout.

Do not remove the existing ColdLoop BLE path.

Prefer:
- separate decoder/transport profile;
- shared source/session abstraction.

---

# 6. Import the AI bundle without corrupting provenance

Before code integration:

1. obtain the verified portable bundle;
2. verify SHA-256;
3. preserve an immutable reference copy inside the repo or documented external artifact location;
4. record model version and bundle checksum;
5. do not edit the reference bundle in place.

Then integrate only the required production pieces into the app:
- feature schema;
- feature extraction;
- model scorer;
- controller/window gate;
- production model JSON;
- production parity vectors.

Keep separate:
- S2 evaluation-only model/vectors;
- optional calibration;
- optional Quality-Life.

Do not integrate calibration or Quality-Life in the first implementation pass.

---

# 7. Use the WebView/TypeScript layer for production inference

Preferred architecture:

```
Capacitor Android
      |
React / TypeScript
      |
EDGE-3 aggregation
      |
PredictionEngine
      |
local bundled model JSON
```

Why:
- existing app already runs there;
- portable model implementation is JavaScript;
- tiny inference cost;
- easiest parity path;
- no network;
- avoids unnecessary Kotlin duplication.

Do NOT port to Kotlin unless a concrete blocker proves the shared WebView path cannot satisfy the required app behavior.

---

# 8. Build an exact EDGE-3 ingestion pipeline

This is more important than drawing the AI UI.

## 8.1 Raw validation

For every EDGE-3 packet:
- validate protocol/version;
- validate sensor ID;
- validate temperature finite and -55..125 °C;
- invalid/missing probe remains `null`;
- do not substitute another probe;
- reject duplicate/reordered packets using the verified ColdTrace sequence logic where applicable.

## 8.2 Time

Use robust timestamp handling.

Preserve the verified ColdTrace principles:
- live BLE receipt gets a monotonic-derived epoch clock;
- do not let a phone clock adjustment reorder history;
- replay timestamps preserve recorded chronology;
- stale/reordered packets cannot silently rewrite old buckets.

## 8.3 Fixed 10-minute aggregation

Bucket key:

`floor(timestamp_ms / 600000) * 600000`

For each closed bucket produce:

```ts
{
  timestamp_ms,
  Front_Middle,
  Middle_Middle,
  Rear_Middle
}
```

Average valid observations per probe inside the bucket.

Do not:
- compress missing buckets;
- interpolate long gaps;
- fill a missing probe from another probe.

## 8.4 Seven-row window

Keep the last seven chronological completed buckets.

Prediction remains unavailable unless:
- exactly seven rows;
- exact 600,000 ms spacing;
- sufficient overall temperature history;
- current row has at least two probe positions;
- at least two positions exist in at least four of seven rows.

Use the bundle's exact gate.

---

# 9. Build a PredictionEngine, separate from ConditionEngine

Do not contaminate current-condition logic.

Conceptual architecture:

```
Telemetry source
   |
   +--> ConditionEngine
   |      current condition/events
   |
   +--> Edge3Aggregator
          |
          PredictionEngine
          future thermal-risk forecast
```

PredictionEngine state should include at least:

```ts
type PredictionState =
  | { status: 'unavailable'; reason: string }
  | { status: 'warming'; readyMinutes: number; requiredMinutes: 60 }
  | { status: 'degraded'; reason: string }
  | { status: 'ready'; score: number; alert: boolean; modelVersion: string };
```

Exact naming can differ.

Important:
- insufficient history is not LOW;
- missing probe/gap is not LOW;
- incompatible ColdLoop node is not LOW;
- offline is not an error because inference is local.

---

# 10. Persistence and restart behavior

Persist enough completed EDGE-3 history for the app to resume intelligently.

Minimum:
- last seven completed compatible 10-minute buckets;
- source profile/identity;
- model version;
- last valid timestamp.

On app restart:
- restore only if source/model identity is compatible;
- validate exact spacing again;
- if a gap exists, fall back to warm-up/degraded state;
- do not manufacture continuity.

Do not persist raw high-frequency packets unless necessary.

This keeps storage simple and avoids needless complexity.

---

# 11. Background behavior: be honest and deadline-smart

Do not accidentally spend hours implementing a production-grade Android foreground BLE service unless the current project already supports it cheaply.

Hackathon MVP requirement:
- AI works fully offline while app is active;
- completed buckets persist;
- app resumes safely;
- gaps are detected instead of faked.

If Android suspends collection while the app is backgrounded:
- do not claim continuous background monitoring;
- document it as a prototype limitation.

Only implement a native background/foreground service if:
1. the current stack makes it straightforward;
2. it can be verified quickly;
3. it does not endanger the working build.

No heroics for a feature that cannot be properly tested before judging.

---

# 12. Prediction event policy

Keep raw model output and user-facing event grouping separate.

For MVP:
- calculate one score per completed valid 10-minute bucket;
- current prediction alert follows the raw `score >= 0.50` result;
- create one forecast event when state changes from below threshold to above threshold;
- keep that event active while successive valid model outputs remain above threshold;
- close it when the next valid model output falls below threshold;
- do not create one History entry every ten minutes.

Do not add smoothing/hysteresis in v1 unless real replay testing proves threshold chatter is a usability problem.

If hysteresis is added later, document it as notification policy, not model behavior.

---

# 13. Human-facing AI semantics

Avoid `LOW RISK` as a giant green safety-looking claim.

Preferred user-facing states:

### no compatible source
Do not show a prominent forecast card on Live.

Device/detail may say:
`Predictive forecast requires a compatible 3-probe ColdTrace source.`

### building history
`Thermal forecast`
`Building history · 40 / 60 min`

### degraded
`Thermal forecast paused`
`History gap` or `Probe coverage insufficient`

### ready, below threshold
`Thermal forecast`
`No model alert · next 120 min`

### ready, above threshold
`Thermal forecast`
`Model alert · next 120 min`

Supporting copy:
`Strawberry prototype · ColdTrace Edge`

Do not use:
- Safe;
- Unsafe;
- Spoiling;
- X% chance of spoilage;
- Shelf life remaining;
- Confidence 64%.

---

# 14. Where the forecast belongs in the UI

Do not redesign Live into an AI dashboard.

## Live

When source supports EDGE-3:
- add one compact forecast surface after current-condition metrics/trend;
- it should be visually secondary to current temperature but clearly discoverable;
- state is readable without opening detail.

When source does not support EDGE-3:
- do not waste Live space with a permanent disabled AI card.

## Forecast detail

Use the shared accessible detail/dialog primitive.

Show only useful information:

1. forecast state;
2. horizon: next 120 minutes;
3. history readiness/coverage;
4. three current probe values;
5. recent three-probe trend;
6. model version/profile;
7. raw score and threshold under "Technical details";
8. short limitation copy.

Potential explanation section:
`Signals associated with this score`

If implemented:
- use exact logistic feature contributions;
- translate feature names to human labels;
- do not call them causes;
- show at most 3 useful contributors;
- hide behind progressive disclosure if cluttered.

Do not expose all 22 features.

---

# 15. Action guidance

If model alert is active, the app may provide a short operator checklist.

Example:

`Review cooling and handling conditions.`

Possible generic checks:
- verify cooling/setpoint;
- inspect recent handling/loading;
- verify probe placement/coverage.

These are operator checks, NOT AI-diagnosed causes.

If the app does not observe a door/compressor/setpoint signal, do not present it as evidence.

---

# 16. Commodity/profile truth

The current trained model is strawberry-specific prototype evidence.

Display a subtle profile indicator in forecast detail:
`Profile: Strawberry prototype`

Do not silently make forecast available for arbitrary commodities.

Future profile architecture may allow multiple models, but do not build an elaborate profile marketplace now.

---

# 17. Keep monitoring threshold and model features separate

Current ColdLoop condition threshold may be user-configurable around values such as 8 °C.

ColdTrace learned features include fixed references such as 4 °C.

These are not the same mechanism.

Rules:
- changing the user's current-condition warning threshold must NOT modify model feature thresholds;
- AI technical detail may explain that forecast model uses fixed learned feature definitions;
- avoid presenting 4 °C and 8 °C together without labels that distinguish:
  - current-condition alert threshold;
  - model feature reference.

---

# 18. Demo architecture

There are two different demos.

## 18.1 Condition fallback demo

Existing deterministic ColdLoop demo proves:
- UI works;
- current condition flow;
- warning;
- History;
- recovery;
- hardware fallback.

Presenter-visible primary controls:
- Normal
- Excursion
- Recovery

Engineering failures stay behind Advanced.

## 18.2 Predictive AI replay

Because real model warm-up needs 60 minutes, add accelerated compatible replay.

Replay must:
- use real three-probe formatted observations;
- preserve 10-minute timestamps internally;
- feed the same aggregation/prediction path as compatible physical EDGE-3 input where practical;
- be clearly labelled:
  `Accelerated shipment replay`.

Do not imply one second of demo time equals one second of field time.

---

# 19. Production replay versus S2 evaluation replay

Keep these roles impossible to confuse.

## Normal production inference
Model:
`coldtrace-edge3-logistic-v1`

Use:
- physical compatible EDGE-3;
- normal product replay.

## Held-out evaluation replay
Model:
`coldtrace-edge3-logistic-s2-loso-v1`

Use ONLY:
- explicitly labelled S2 held-out evaluation replay;
- presenter/evidence mode.

Never:
- load S2 model for normal live prediction;
- call S2 F1 the overall model performance;
- hide that S2 is one held-out shipment / strongest fold.

Add a test that normal product code cannot resolve to the S2 model version.

---

# 20. Presenter mode

Judge-facing presenter controls should be simple.

Visible:

```
MONITORING
[ Normal ] [ Excursion ] [ Recovery ]

PREDICTIVE AI
[ Run shipment replay ]
```

Optional:
`Held-out evaluation replay` under a clearly labelled evidence/advanced section.

Hide:
- malformed packet;
- permissions;
- DHT fault;
- ENS fault;
- Bluetooth off;
- timeout;
- other QA scenarios.

Those remain available under `Advanced scenarios`.

The phone remains visually dominant.

---

# 21. History

History must distinguish event families and sources.

Examples:

```
FORECAST
Model alert · next 120 min
Accelerated replay

CONDITION
Temperature above threshold
BLE sensor

AIR / VOC
VOC condition changed
BLE sensor
```

Every event stores:
- type;
- source session;
- source kind;
- start/end;
- model version where applicable;
- simulated/evaluation marker where applicable.

No source mixing.

---

# 22. Accessibility requirements

Implement, do not advertise vaguely.

Required:
- warnings/statuses are not color-only;
- >=44 px primary touch targets;
- meaningful accessible labels;
- shared dialog focus management;
- focus restoration;
- Escape closes dialogs on web;
- reduced-motion respected;
- chart/detail has text summary;
- test larger text/layout once before final;
- prediction alert state should be announced politely if it changes while screen is active.

Do not claim WCAG compliance unless actually audited against it.

---

# 23. Efficient test strategy

The goal is high confidence, not ritualistic testing.

## Rule A — targeted tests during development

After a small change:
- run only affected unit/module tests;
- run TypeScript/build check when type surface changes.

Do NOT rerun the full visual matrix after every edit.

## Rule B — full suite only at milestones

Full test/build runs:
1. after P1 fixes;
2. after AI engine/data path is stable;
3. after UI integration;
4. final release gate.

## Rule C — one development viewport

During UI work use:
`390x844`

Only final QA needs:
- 360x800
- 390x844
- 412x915
- Android emulator
- desktop showcase.

## Rule D — high-value AI tests only

Required AI tests:

### Math parity
- all 24 production parity vectors;
- tolerance explicitly defined;
- no need to invent hundreds of random tests.

### Pipeline
Create a small set of end-to-end fixtures:
1. valid seven-bucket window -> READY;
2. only six buckets -> WARM-UP;
3. timestamp gap -> WARM-UP/degraded;
4. missing one probe but valid EDGE-3 coverage -> correct score;
5. insufficient spatial coverage -> prediction unavailable;
6. out-of-range sensor -> null / gate behavior;
7. score just below/above threshold -> correct alert state.

### Source isolation
1. BLE event cannot be recovered by Demo;
2. Demo event cannot be recovered by BLE;
3. AI replay event cannot leak into physical session.

### Model-role
- production mode loads all-six model;
- S2 model available only in evaluation replay.

### Persistence
- seven valid buckets survive restart;
- stale/gapped restart does not fake READY.

That is enough. Do not build a laboratory.

---

# 24. Efficient UI journey tests

Development smoke journey at 390x844:

1. cold launch;
2. condition demo normal;
3. condition excursion;
4. recovery/history;
5. compatible AI replay starts;
6. building-history state;
7. model-ready no-alert state;
8. model-alert state;
9. forecast detail;
10. source switch resets correctly.

Automate where practical with existing Playwright.

Do not screenshot every transitional frame.

---

# 25. Final visual QA

After the LAST meaningful UI change only:

Capture at:
- 360x800;
- 390x844;
- 412x915;
- Android emulator;
- desktop showcase.

Required final screenshots:
1. disconnected;
2. normal monitoring;
3. current-condition warning;
4. forecast building history;
5. forecast ready/no alert;
6. forecast model alert;
7. forecast detail;
8. History containing condition + forecast events;
9. Device source/capabilities;
10. Settings;
11. presenter normal;
12. presenter AI replay.

Inspect them as a connected journey.

Fix P0/P1.
Do not chase microscopic P3 spacing defects while deadline-critical functionality remains.

---

# 26. Android/offline acceptance test

This is mandatory.

Final APK test:

1. build debug APK;
2. install on emulator;
3. launch;
4. disable network;
5. cold-launch app;
6. run local compatible AI replay;
7. progress through history warm-up;
8. reach model READY;
9. produce expected prediction;
10. open forecast detail;
11. confirm no prediction API/network request;
12. kill/relaunch;
13. verify persisted valid history behavior;
14. verify Android Back behavior;
15. verify condition demo still works.

Physical Bluetooth remains a separate final validation if hardware is available.

Do not block the software demo on physical radio success.

---

# 27. Performance sanity check

Do not over-benchmark a 4 KB logistic model.

Measure once:
- model load succeeds locally;
- inference latency is visibly negligible;
- no UI jank from scoring;
- app bundle/APK size remains reasonable.

No week-long performance project.

---

# 28. Scientific claim QA

Before completion, search the app for dangerous wording.

Reject/replace:
- spoilage probability;
- safe/unsafe;
- shelf life predicted by AI;
- expiry extension;
- calibrated probability;
- root cause detected;
- AI confidence %.

Allowed:
- thermal-risk score;
- model alert;
- next 120 min;
- strawberry prototype;
- operator review;
- simulated/replay source;
- held-out evaluation replay.

---

# 29. Implementation sequence

Execute in this order:

### Phase 1 — Stabilize
- fix P1 app defects;
- targeted tests;
- full current suite once.

### Phase 2 — Source architecture
- source sessions;
- capabilities;
- source isolation;
- exact EDGE-3 decoder/profile.

### Phase 3 — Model integration
- import verified bundle;
- production model locally bundled;
- TypeScript wrapper/port;
- 24-vector parity.

### Phase 4 — Data pipeline
- packet order/time handling;
- 10-minute aggregation;
- 7-row buffer;
- gap/coverage gates;
- persistence.

### Phase 5 — Prediction engine
- state machine;
- production model only;
- forecast-event grouping;
- model-version/source metadata.

### Phase 6 — Replay
- production-model compatible replay;
- accelerated chronology;
- evaluation-only S2 replay isolated.

### Phase 7 — UX
- compact Live forecast;
- forecast detail;
- History integration;
- Device capability/source;
- Settings cleanup only as needed.

### Phase 8 — Presenter
- simple visible controls;
- advanced QA controls hidden;
- phone visually dominant.

### Phase 9 — Accessibility/polish
- dialog/focus;
- small text;
- source labeling;
- branding;
- reduced motion;
- text scaling smoke.

### Phase 10 — Final QA
- full suite;
- Android build/install;
- offline acceptance;
- final screenshot matrix;
- final claim search;
- evidence update.

---

# 30. Stop / escalation rules

Do NOT stop for:
- a small naming decision;
- a minor CSS imperfection;
- a nonessential optional feature;
- physical BLE unavailable;
- cloud unavailable.

Use the documented fallback and continue.

Stop and surface the blocker if:
- production model parity fails;
- model bundle checksum differs;
- compatible EDGE-3 data contract cannot be established;
- Android build is broken with no safe rollback;
- implementation requires fabricating missing probes;
- production/evaluation model separation cannot be guaranteed;
- a change would require replacing the working app.

---

# 31. Definition of done

The AI integration is complete only when:

- existing monitoring app still works;
- existing P1 correctness defects are fixed;
- source sessions prevent cross-source contamination;
- current ColdLoop node cannot generate fake EDGE-3 predictions;
- compatible EDGE-3 data can flow into the prediction pipeline;
- production model is bundled locally;
- 24 production parity vectors pass inside integration;
- warm-up/gap/missing-probe gates work;
- completed buckets persist safely;
- forecast states are scientifically honest;
- prediction events are grouped sensibly;
- production model and S2 evaluation model are isolated;
- AI replay works without network or physical hardware;
- Android APK works offline;
- forecast UI is usable and not cluttered;
- accessibility P1 issues are fixed;
- presenter mode is clean;
- final screenshots were generated after the final meaningful UI change;
- no unsupported safety/spoilage/shelf-life claim appears;
- unresolved physical BLE work is clearly marked physical-required rather than faked.

Finish the product. Do not turn the plan into another research project.
