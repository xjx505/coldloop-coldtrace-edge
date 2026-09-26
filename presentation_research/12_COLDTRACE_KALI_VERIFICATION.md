# ColdTrace Kali Verification Update — 2026-09-26

The ColdTrace implementation **does exist** and was found on the Kali machine `titto-kali-fixed` at:

`/home/t2/Documents/Codex/2026-09-25/save/outputs/coldloop`

This resolves the earlier concern that the ColdTrace handoff might only be a design narrative.

## Directly inspected project structure

The workspace contains the implementation paths previously referenced by the handoff, including:

- `backend/model/edge_train.py`
- `backend/model/export_edge.py`
- `backend/model/export_edge_s2.py`
- `backend/model/artifacts/`
- `edge/model/edge_model.json`
- `edge/model/edge_model_s2_loso.json`
- `edge/feature_engine.py`
- `edge/tests/`
- `edge/esp32/src/main.cpp`
- `edge/esp32/firmware/firmware.bin`
- `frontend/edge/`
- `backend/app/services/edge_sync.py`
- `backend/app/services/forensics.py`
- `backend/app/services/weakpoints.py`
- `backend/app/services/rescue.py`
- `quality_life/profiles/strawberry_v1.json`
- documentation, screenshots, UX audits and stress reports.

## Fresh verification

Command executed on Kali:

```bash
cd /home/t2/Documents/Codex/2026-09-25/save/outputs/coldloop
./scripts/preflight.sh
```

Observed result:

- 22/22 preflight checks PASS
- 21 pytest tests PASS
- 1 non-fatal Starlette/httpx deprecation warning
- backend health/local artifacts PASS
- ESP32 physical presence explicitly not tested
- final preflight output: `READY FOR DEMO`

## Verified model/data story from current docs/artifacts

Current ColdTrace architecture:

ESP32-C3 or normalized virtual BLE packets
→ local 10-minute aggregation
→ EDGE-3 60-minute history window
→ phone-side JavaScript logistic scoring
→ local alert/forensics/IndexedDB queue
→ later FastAPI/SQLite sync.

Cloud is not used for driver inference.

Current selected model:
- EDGE-3 regularized logistic regression
- all-six deployment artifact plus separate S2-held-out replay artifact
- 60-minute feature history
- target: processed R2 thermal-risk state within the next 120 minutes
- phone loads JSON model, not pickle

Current six-shipment LOSO headline metrics documented in the implementation:
- macro F1: 0.236
- macro recall: 0.441
- macro PR-AUC: 0.320
- event coverage: 11/41 observed R2 onsets
- HIGH-window share: 35.0%
- mean warning lead: 85.5 minutes

Important: these are prototype six-shipment metrics, not production validation.

S2 held-out judge replay:
- 188 windows / 32 positive
- F1 0.743
- 3/4 R2 onsets covered
- mean lead 86.7 minutes
- final pre-event replay score in current repeated Chromium flow: HIGH 0.9958

Important: S2 is one held-out shipment and must not be presented as overall system performance.

## Dataset

Current DATA_CARD identifies:
- source: NifferLi/Cold-Chain-Transportation-Strawberry
- exact article-release file: `article_release/ALL_benchmark_W60.parquet`
- repo revision: `4f9541d8a20616b3c5fedc7d9fd27a8a0b6701dc`
- local file: 14,398 rows, 107 columns
- six physical shipments S1-S6
- nine nominal probe positions
- processed 10-minute timestamps and 60-minute historical features
- no Qatar facility/GPS/door/reefer/humidity/action-response/cause ground truth

## Quality-Life

A separate strawberry Quality-Life engine now exists in this Kali workspace.

It is:
- literature-based / Arrhenius-style
- separate from the learned thermal-risk model
- not AI trained on these six shipments
- not a food-safety decision
- not a legal expiry
- not measured waste reduction.

Do not merge the learned risk model and Quality-Life model into one "AI shelf-life model."

## Hardware/demo boundary

ESP32-C3 firmware compiles and a firmware binary exists.

The ColdTrace hardware path is the three-probe / 15-byte BLE path described in this workspace.

However:
- no physical board was available in this environment;
- no physical Android handset was available;
- flashing, BLE pairing and real probe-placement validation remain unverified.

The virtual/replay path is verified and uses the same normalized telemetry pipeline.

## Presentation consequence

The main presentation should now treat **ColdTrace Edge as a real implemented software prototype**, not merely a future design.

The strongest truthful framing is:

- real six-shipment strawberry data
- edge/local inference
- out-of-sample shipment-level evaluation
- offline operation
- conservative forensics with UNKNOWN
- later sync/fleet weak-point learning
- separate literature-based Quality-Life estimate
- optional ESP32-C3 hardware path, not physically validated yet

Do not conflate this with the separate Windows ColdLoop Monitor app based on DHT22/MQ-135/ENS160 and 20-byte BLE. They are different prototype branches.

For the PowerPoint, prioritize the **ColdTrace Kali implementation** as the AI prototype unless the team explicitly decides otherwise.
