# ColdTrace risk calibration

## Status

ColdTrace's operational HIGH/LOW decision still uses the original EDGE-3 raw logistic score at the fixed 0.50 threshold. The calibration layer is secondary and does not change alert behavior.

A nested shipment-level Platt-scaling experiment was added because the class-weighted logistic score is not a calibrated probability.

## Method

For each of six outer leave-one-shipment-out folds:

1. One complete shipment is held out.
2. Only the remaining five shipments are used.
3. Inner leave-one-shipment-out predictions are generated inside those five shipments.
4. Platt scaling is fitted only to those inner out-of-fold scores.
5. The EDGE-3 classifier is fitted on the complete five-shipment outer-training set.
6. Raw and calibrated predictions are evaluated once on the untouched outer shipment.

The calibrator therefore never sees the outer held-out shipment during fitting.

The S2 judge replay uses a separate calibrator fitted only from inner predictions on S1, S3, S4, S5 and S6.

## Results

| Metric | Raw | Platt calibrated |
|---|---:|---:|
| Mean Brier score | 0.1954 | 0.0825 |
| Median Brier score | 0.1947 | 0.0746 |
| Mean log loss | 0.5824 | 0.3026 |

Brier and log loss improved on 5 of 6 held-out shipments. S2 is the exception: Brier worsened from 0.1287 to 0.1462. This instability is why the interface calls the calibrated value a **prototype calibrated R2 estimate**, not a production probability.

Artifacts:

- `backend/model/artifacts/calibration/edge3_platt_nested.json`
- `edge/model/edge_calibration.json`
- generator: `backend/model/calibrate_edge.py`

## Interpretation

The calibrated value estimates the frequency of the existing supervised target: **R2 within the next 120 minutes**. It is not a probability of spoilage, food safety, remaining shelf life, donation suitability or waste reduction.

The six independent shipments remain too small for production calibration. More independent trips, sites, seasons and operating conditions are required.
