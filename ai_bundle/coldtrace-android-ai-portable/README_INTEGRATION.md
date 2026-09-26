# ColdTrace Android AI Bundle

Portable on-device inference assets and integration notes for the existing ColdLoop / ColdTrace Android app. This bundle is intended to be handed to the other implementation chat together with the Android project.

## What this is

This is **not a fine-tuned language model**. ColdTrace’s trained model is a small, regularized, class-weighted Logistic Regression classifier. The exported JSON is 4,224 bytes and includes the fitted imputer medians, scaler statistics, coefficients, intercept, threshold, feature order and feature schema. The bundle includes the exact JavaScript feature and scoring implementation used by the current offline driver app.

The production artifact is `model/edge_model.json`, version `coldtrace-edge3-logistic-v1`. It was fitted on all six source shipments after shipment-held-out evaluation. Its output is a raw thermal-risk score for the dataset target `y_next_120_R2`: whether the processed severe thermal state R2 occurs within the next 120 minutes. HIGH is `score >= 0.50`.

The raw score is **not a calibrated real-world probability**. Do not label it a percentage chance, spoilage probability, shelf-life estimate, food-safety result or confidence value. Keep operator review in the Android flow. Do not use the score to declare product safe/unsafe, assign root cause, approve donation, or control a reefer automatically.

## Bundle contents

- `model/edge_model.json`: production all-six EDGE-3 Logistic Regression model; use this in normal app inference.
- `model/feature_schema.json`: seven-row/60-minute window, ten-minute cadence, sensor configuration and feature names.
- `src/features.js`, `src/model.js`, `src/controller.js`: the production JavaScript feature extraction, JSON model scorer and window-validity gate. `src/index.js` exports the public functions.
- `tests/all_six_parity_vectors.json`: 24 raw windows with expected features and scores for implementation parity. These are parity fixtures, not held-out performance evidence.
- `tests/run_golden_tests.mjs`: dependency-free Node test for feature/score parity, warm-up and gap behavior.
- `calibration/edge_calibration.json` and `src/calibration.js`: optional secondary nested Platt estimate. It does not change the raw alert threshold. Treat it as prototype-only; Brier/log loss worsened on S2.
- `evaluation_only/`: S2-held-out model, scorecard and 24 S2 parity vectors. These are for the judge replay/evaluation only. **Do not load this model for normal production inference.**
- `quality_life/`: optional literature-based strawberry Quality-Life model and profile. This is a kinetic calculation, not a trained AI model.
- `docs/`: current model card, data provenance, calibration caveat and Quality-Life boundaries.
- `LICENSE`: Apache-2.0 project license. The source data repository declares Apache-2.0. Dataset citation titles and DOIs are recorded in `docs/DATA_CARD.md`.

The bundle intentionally omits the raw training Parquet, Python joblib models, backend, cloud sync, UI assets, and Three.js visualization. Android inference needs only the tiny JSON model and the feature/scoring code. No TensorFlow Lite, ONNX runtime, native ML runtime, server request or GPU is needed.

## Exact input and inference contract

The model is configured for **EDGE-3**, with these fields on every processed ten-minute observation:

```json
{
  "timestamp_ms": 1770000000000,
  "Front_Middle": 2.1,
  "Middle_Middle": 2.4,
  "Rear_Middle": 2.8
}
```

Use numeric Celsius values or `null` when unavailable. The three keys are probe positions, not arbitrary sensor names. A one-probe installation is not compatible with this EDGE-3 model.

The Android data path must preserve the current project contract:

1. Decode BLE readings and reject non-finite or out-of-DS18B20-range values (`-55..125°C`). Keep rejected/missing readings as `null`; do not invent a replacement sensor value.
2. Average valid packets for each probe inside fixed epoch-aligned ten-minute buckets. The production app’s bucket key is `floor(timestamp_ms / 600000) * 600000`. Feed the bucket timestamp, not the individual one-second BLE receipt time, to the model.
3. Retain seven chronological ten-minute rows. Do not compress missing buckets or interpolate a long gap into seven consecutive windows.
4. Call `evaluateWindow(lastSevenRows, model)`. It returns `MODEL WARM-UP` unless there are exactly seven rows with exact 600,000 ms spacing and valid EDGE-3 coverage. Missing channels stay `null`; the model applies the stored imputation and scaling itself.
5. When it returns `READY`, display `score` as an **uncalibrated thermal-risk score** and derive the alert with `high` / `score >= model.decision_threshold`. Keep cloud synchronization separate; it must not be a dependency of local scoring.

The current feature contract also requires at least four usable seven-window aggregate means, at least two current probe positions, and at least two positions in four of the seven rows. If any gate fails, retain warm-up/degraded UI; do not coerce it into LOW risk.

## Quick start in the existing WebView/JavaScript layer

Place the bundle under the app’s local assets, for example:

```text
app/src/main/assets/ai/
  model/edge_model.json
  src/features.js
  src/model.js
  src/controller.js
  src/index.js
```

Use the app’s existing local asset mechanism. For Android WebView, prefer the app’s existing `WebViewAssetLoader` HTTPS-style asset origin instead of loading ES modules with `file://`; this keeps local module imports and `fetch()` on a secure origin.

Example module usage:

```js
import { evaluateWindow } from './src/index.js';

const model = await fetch('./model/edge_model.json').then((response) => {
  if (!response.ok) throw new Error(`Model load failed: ${response.status}`);
  return response.json();
});

const result = evaluateWindow(lastSevenTenMinuteRows, model);
if (result.status === 'READY') {
  renderThermalRisk({
    score: result.score,
    tier: result.high ? 'HIGH' : 'LOW',
    threshold: model.decision_threshold,
    modelVersion: model.model_version,
  });
} else {
  renderWarmup(result.reason ?? result.status);
}
```

`evaluateWindow` is synchronous and local. It does not call `fetch`, a backend, or any inference service. The page must already have loaded the module and model JSON for offline use.

## Native Kotlin integration option

If the existing app performs inference in native Kotlin rather than WebView, port the small math path in `src/features.js`, `src/model.js`, and `src/controller.js`; do not try to load the `.joblib` file. Read all model parameters from `model/edge_model.json`, preserve the exact `feature_names` order, and verify the Kotlin port against all 24 `tests/all_six_parity_vectors.json` cases with maximum score error `<= 1e-6` (the shipped JavaScript parity test uses `1e-10`).

The score calculation is:

```text
z = intercept
  + sum_i (((feature_i_or_median - scaler_mean_i) / scaler_scale_i) * coefficient_i)
  + sum_j (((missing_indicator_j - scaler_mean_j) / scaler_scale_j) * coefficient_j)
score = stable_sigmoid(z)
```

A feature is missing when its value is `null`, non-finite, or absent. The missing-indicator array is currently empty, but the JSON model contains the field and the scorer supports it. Do not assume the coefficients can be applied directly to raw temperatures: feature construction, median imputation and standardization are all part of the model.

## Optional calibration

The raw score and fixed 0.50 HIGH threshold remain the production behavior. If the Android UI must reproduce the optional calibrated display, load **only** `calibration/edge_calibration.json` → `deployment_calibrator` for the all-six deployment model, then call `applyPlatt(rawScore, calibrator)` from `src/index.js`. Label it “prototype calibrated R2 estimate,” never a validated probability. Do not use `s2_replay_calibrator` with the all-six model or S2 model outside the S2 evaluation replay. This experiment improves Brier/log loss on five of six folds but worsens both metrics on S2; six shipments are not enough for production calibration.

## Optional Quality-Life module

`quality_life/quality_life.js` is separate from the trained risk classifier. It is a literature-calibrated first-order Arrhenius strawberry quality model. Use it only if that part of the product plan is wanted in the Android app. It requires ten-minute observations, at least two eligible probe positions and intact time coverage for absolute RQL. It excludes intervals over 20 minutes and suppresses absolute RQL when time coverage is degraded. Absolute remaining quality life also requires an explicitly supplied external starting-RQL value. Without that value, show observed equivalent exposure age only.

It is not a food-safety result, legal expiry, measured shelf life or learned prediction from the six shipments. See `docs/QUALITY_LIFE_MODEL.md` and `docs/QUALITY_LIFE_SOURCES.md` before displaying it.

## Run the bundled parity test

With Node.js installed on a development machine:

```bash
node tests/run_golden_tests.mjs
```

Expected output includes `"result": "PASS"`, 24 production vectors, 24 evaluation-only S2 vectors, a warm-up gate and a gap gate. The S2 vectors validate the S2 evaluation artifact only; they are not a substitute for production-model tests.

Before shipping the Android change, run the test against the app’s Kotlin/JavaScript implementation too. Also verify: offline cold launch after assets were cached, no `/predict-risk` or other inference network request, seven-window warm-up, 10-minute gap rejection, null/out-of-range probes, model version display, HIGH threshold behavior, and human review flow.

## Project evidence and limits

- Training data: 14,398 processed rows from six independent strawberry shipments; no measured quality-life or verified spoilage labels.
- All-six shipment-held-out EDGE-3 macro F1: 0.236; recall: 0.441; PR-AUC: 0.320. These are six-shipment cross-validation results, not field validation.
- The all-six model is trained on all six after LOSO evaluation; its individual outputs on these same trips are not held-out performance.
- S2 evaluation model is trained on S1/S3/S4/S5/S6 and held out on S2. Its F1 is 0.743 on 188 S2 windows, but it represents one held-out shipment only.
- A separate Modal NVIDIA Tesla T4 benchmark trained XGBoost candidates; the selected phone model is JavaScript Logistic and does not use the GPU.
- No current-R2 live state detector is independently validated by this bundle. The model forecasts the processed dataset R2 target; it does not determine that the product is unsafe or already spoiled.

## Prompt for the other implementation chat

> Integrate the attached ColdTrace Android AI bundle into my existing Android app. First inspect the current Android project and this `README_INTEGRATION.md`; preserve the app’s current architecture and working UI. Use only `model/edge_model.json` for normal on-device EDGE-3 scoring. Reuse the bundled feature/scoring modules if the app is WebView-based, or port them exactly if it is native Kotlin, then run `tests/run_golden_tests.mjs` and parity-check the app implementation. Keep ten-minute aggregation, seven exact consecutive rows, all null/gap guards, the raw 0.50 HIGH threshold, offline inference and human review. Treat `evaluation_only/` as S2 judge replay only. Treat Platt output as prototype-only and Quality-Life as an optional literature equation, not trained AI. Do not add cloud inference, safety/expiry claims, or replace the existing app with a new one.
