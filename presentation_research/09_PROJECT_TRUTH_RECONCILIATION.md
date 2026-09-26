# Project Truth Reconciliation — 2026-09-26

## Bottom line

There are currently **two different project branches/narratives** in the available material.

They must not be blended into one "working prototype."

### Branch A — locally verified implementation

**Name used by the software:** ColdLoop
**Location:** `%USERPROFILE%\Documents\ColdLoop`

This is the implementation that can currently be inspected, built, tested and evidenced directly on ABED-PC.

It is:

- an ESP32-C3 sensor node;
- DHT22 temperature/humidity;
- MQ-135 broad relative gas/VOC response;
- ENS160 digital air/VOC outputs;
- 20-byte BLE telemetry;
- Android app built with React/Vite/TypeScript + Capacitor;
- native BLE central support;
- deterministic mock/demo transport;
- event/history/device/settings UI;
- threshold/rule-based condition monitoring.

It is **not currently a trained machine-learning cold-chain prediction system**.

The current event engine is deterministic:
- temperature event after sustained threshold breach;
- air/VOC event after repeated ENS160 threshold breach;
- explicit recovery handling;
- bounded local event history.

The firmware anomaly score is also a heuristic sum based on temperature, MQ-135 relative rise, TVOC and sensor faults.

### Branch B — ColdTrace Edge handoff narrative

**Source:** `%USERPROFILE%\Downloads\ColdLoop_ColdTrace_Final_Team_Handoff.md`

This describes a materially different system:

- ColdLoop as the larger platform vision;
- ColdTrace Edge as the hackathon prototype;
- real strawberry shipment dataset;
- 60-minute history -> 120-minute future thermal-risk prediction;
- EDGE-3 logistic-regression model;
- three DS18B20 probes;
- 15-byte BLE packet;
- installable/offline PWA;
- no-cloud inference;
- FastAPI + SQLite sync;
- evidence-based forensics;
- weak-point analytics;
- food-rescue demonstration;
- exact model/evaluation/GPU/parity metrics.

This narrative is a strong Challenge 2 story, but **the implementation artifacts it cites are not present in the verified ColdLoop repository and have not been found elsewhere on ABED-PC**.

Referenced-but-missing paths include:

```
docs/IMPLEMENTATION_REPORT.md
docs/EDGE_ARCHITECTURE.md
docs/EDGE_MODEL_CARD.md
docs/EDGE_MODEL_COMPARISON.md
backend/model/edge_train.py
backend/model/export_edge.py
edge/model/edge_model.json
edge/feature_engine.py
frontend/edge/
edge/esp32/
backend/app/services/edge_sync.py
backend/app/services/forensics.py
backend/app/services/weakpoints.py
backend/app/services/rescue.py
```

Every path above was checked against the current ColdLoop repository and returned missing.

Searches of the obvious Documents/Downloads locations and WSL home also did not locate the claimed ColdTrace model/source tree.

Therefore:

> **The ColdTrace handoff is evidence of intended design / claimed implementation, but is not yet evidence that those exact implementation claims are real and runnable.**

That distinction is mandatory for the presentation.

---

# 1. What is genuinely verified right now

## Software/application

Verified from current source + QA evidence:

- React/Vite/TypeScript shared UI.
- Capacitor native Android package.
- Native BLE transport using `@capacitor-community/bluetooth-le`.
- Android package ID `com.coldloop.monitor`.
- Functional Live / History / Device / Settings views.
- Temperature and air/VOC detail views.
- Deterministic demo scenarios.
- BLE/error/reconnect/stale/malformed-packet states.
- Local event/settings persistence.
- Desktop `/showcase` presentation surface using the same app.

## Android evidence

`qa/reports/android-build-20260926.log`:
- web build PASS;
- Capacitor sync PASS;
- Gradle `assembleDebug` PASS;
- plugin `@capacitor-community/bluetooth-le@8.3.0`.

APK physically exists:

`app/android/app/build/outputs/apk/debug/app-debug.apk`

Verified size:
- 4,412,459 bytes.

Verified SHA-256:
- `2E0759260FA5581E703BB70B94FC563B687BB1217769EE9E7AAC9CFFF7CA32BD`.

`qa/reports/android-journey.json`:
- PASS;
- 21 screenshots;
- 35 recorded interaction steps;
- zero runtime exceptions;
- cold launch;
- normal demo;
- warning/recovery;
- History;
- Device;
- Settings;
- Android Back;
- background/foreground;
- force-stop/relaunch;
- persistence.

## Web/showcase evidence

`qa/reports/web-journey.json`:
- PASS;
- 72 screenshots;
- 360x800;
- 390x844;
- 412x915;
- 1440x1000 showcase;
- no recorded page/console failures;
- no horizontal overflow in tested viewports.

`qa/reports/VISUAL_AUDIT.md`:
- PASS;
- P0 unresolved = 0;
- P1 unresolved = 0.

## Firmware evidence

Actual current firmware:
- ESP32-C3;
- DHT22 GPIO4;
- MQ-135 ADC GPIO0;
- ENS160 I2C GPIO6/GPIO7;
- BLE device `ColdLoop-01`;
- service UUID `6d6f0001-7c62-4f44-a4d2-0c5a9b2bca01`;
- telemetry UUID `6d6f0002-7c62-4f44-a4d2-0c5a9b2bca01`;
- packed 20-byte little-endian telemetry;
- serial JSON diagnostics;
- hardware and Wokwi build modes.

`qa/reports/build-all-20260926.log`:
- PlatformIO hardware firmware PASS;
- Wokwi firmware PASS;
- Vitest 5 files / 14 tests PASS.

Firmware artifacts exist:

Hardware firmware:
- 1,031,872 bytes;
- SHA-256 `1DD84BF5D001608CA8E7F97C4D1893D8E6D6EB51D466B7FB78F925C1B47D0378`.

Wokwi firmware:
- 1,026,496 bytes;
- SHA-256 `387FC9F8E34ECB45E7A6E0FA21994CCB738A7F3D1ADAED1323A11BEA3D47D83E`.

## Current automated logic

Verified by source:

### Firmware anomaly score
Heuristic/rule-based, using:
- temperature above configured demo threshold;
- MQ-135 relative response versus baseline;
- TVOC threshold;
- DHT/ENS fault state.

### App event engine
Rule-based:
- sustained temperature threshold breach;
- ENS160 TVOC/AQI watch state;
- recovery rules.

No local source file implements:
- logistic regression;
- XGBoost;
- future R2 prediction;
- shelf-life prediction;
- 60-minute learned feature model;
- on-device ML inference;
- FastAPI fleet backend;
- weak-point statistics.

That means those claims **cannot be attributed to the verified local app**.

---

# 2. What remains physically unverified

The software QA deliberately does not prove real radio/sensor behavior.

`qa/reports/physical-inventory-20260926.txt` showed:
- only Android emulator attached;
- zero physical Android devices;
- no detected ESP32 USB serial device.

Therefore the following remain unverified until physically tested:

- actual ESP32 flash;
- actual DHT22 readings;
- actual ENS160 readings/readiness;
- actual MQ-135 electrical/sensor response;
- actual Android phone -> ESP32 BLE connection;
- actual changing BLE notification stream;
- actual judge-facing warm-air demonstration.

Do not call those "tested" until that happens.

---

# 3. ColdTrace Edge claims: current evidence status

## Research-supported concept — YES

The broader ColdTrace direction is supported by the team's research:
- future thermal-risk prediction from real strawberry cold-chain data;
- shipment-level holdout rather than random adjacent-row split;
- evidence-ranked forensics rather than fake causal labels;
- explicit UNKNOWN/insufficient-evidence state;
- normalized weak-point statistics;
- open/vendor-neutral architecture.

That supports **why the design is defensible**.

It does not prove the final implementation was built.

## Exact implementation claims — NOT YET VERIFIED

Until the actual ColdTrace source/artifacts are located and executed, treat the following as unverified:

- `coldtrace-edge3-logistic-v1`;
- 4,224-byte model JSON;
- exact EDGE-3 F1/Recall/PR-AUC values;
- 11/41 events warned;
- 9 false-alert episodes;
- ~85.5-minute mean warning lead;
- 18 Tesla T4 model fits;
- 16.755-second GPU runtime;
- Python/JavaScript parity over 24 vectors;
- `HIGH · 0.9707` replay result;
- exactly zero cloud inference calls;
- 9 pytest tests;
- FastAPI/SQLite synchronization;
- weak-point implementation;
- rescue implementation;
- DS18B20 firmware;
- 15-byte BLE protocol.

The handoff may be accurate. At present, however, the inspectable evidence needed to certify those claims is missing.

---

# 4. Dataset reconciliation

The handoff's dataset/model story is directionally consistent with the team's ColdTrace research, but its exact dataset counts must be re-audited before use on slides.

Current Hugging Face repository metadata confirms:
- dataset: `NifferLi/Cold-Chain-Transportation-Strawberry`;
- tabular classification;
- Apache-2.0;
- time-series / early-warning / risk-prediction framing;
- dataset originates from the six-shipment strawberry work.

However, the handoff's exact statement that the "article-release Parquet contains 14,398 processed rows" is not yet accepted into the presentation truth ledger.

Before using a row count on a slide:
1. inspect the exact article-release split/file being used;
2. record its filename/hash;
3. calculate rows directly;
4. record the filtering step if a smaller subset is quoted.

Do not mix:
- raw/source observations;
- processed full benchmark rows;
- eligible pre-event rows;
- train/test fold observations;
- one replay trace.

Those are different quantities.

---

# 5. Official Challenge 2 fit

Official Challenge 2 asks for a system that combines cold-chain data to detect issues, estimate risk/predict remaining shelf life, and produce timely practical actions.

### ColdTrace Edge narrative
Strong direct fit, **if implementation evidence is recovered**.

### Current verified ColdLoop Monitor
Strong fit for:
- cold-chain data capture;
- environmental monitoring;
- anomaly/event detection;
- alerts;
- sensor-health and history.

Weak/incomplete fit for:
- AI prediction;
- future risk;
- remaining shelf life;
- logistics/location integration;
- action recommendation.

Therefore it would be misleading to present the current verified local app alone as satisfying the entire AI prediction portion of the challenge.

---

# 6. Canonical truth hierarchy for the future deck

Until further evidence appears, use these categories.

## VERIFIED IMPLEMENTATION

May be stated as built/tested:
- current ColdLoop Android/web app;
- deterministic event engine;
- native BLE software path;
- 20-byte packet/software compatibility;
- ESP32 firmware builds;
- Wokwi build;
- APK build/install/emulator journey;
- web/showcase journey;
- error/recovery/persistence behavior.

## PHYSICAL_REQUIRED

May be described as designed/ready for physical validation:
- actual sensor node readings;
- physical phone BLE;
- real judge-facing hardware demo.

## RESEARCH-SUPPORTED DESIGN

May be described as the design/AI direction, not as locally verified implementation:
- ColdTrace future-risk model;
- shipment-level evaluation methodology;
- conservative forensics;
- weak-point analytics.

## UNVERIFIED IMPLEMENTATION CLAIM

Do not put in the main deck as fact until artifact proof exists:
- exact ColdTrace model metrics;
- exact GPU results;
- exact model size;
- exact PWA offline test;
- exact backend/sync tests;
- 15-byte DS18B20 stack.

## FUTURE PRODUCT VISION

Allowed only when clearly labelled future:
- fleet-wide learning;
- WMS/TMS/EPCIS integration;
- many commodities;
- production retraining;
- autonomous/semiautonomous interventions;
- real partner rescue integration;
- measured food-loss reduction.

---

# 7. Naming recommendation before evidence lock

Do **not** lock the deck name yet.

Current evidence supports:

- `ColdLoop` = actual locally built product name.
- `ColdTrace Edge` = strong intended AI-module name in the handoff.

If the ColdTrace implementation artifacts are recovered and pass independent verification:
- use **ColdLoop** for the platform vision;
- use **ColdTrace Edge** for the working hackathon AI prototype.

If those artifacts cannot be recovered:
- do not call ColdTrace Edge a working prototype;
- either present it as the next AI module or center the judged build on the verified ColdLoop Monitor.

---

# 8. Reconciliation verdict

The project is **not one coherent verified codebase yet**.

It currently consists of:

```
A) VERIFIED SOFTWARE/HARDWARE-SOFTWARE SKELETON
ColdLoop Monitor
ESP32-C3 + DHT22/MQ-135/ENS160
20-byte BLE
Capacitor Android
rule-based condition/event monitoring
strong software QA

and

B) INTENDED / CLAIMED AI PRODUCT BRANCH
ColdTrace Edge
real strawberry data
future-risk ML
offline edge inference
forensics
fleet weak-point analytics
3x DS18B20 / 15-byte BLE
currently missing inspectable implementation artifacts
```

The presentation must not pretend A and B are the same implementation.

The next step is **evidence lock**, not slide construction.
