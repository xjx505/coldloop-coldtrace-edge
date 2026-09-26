# Quality-Life scientific sources and evidence boundary

## Implemented source

Schudel et al. (2022), *Combining experiments and mechanistic modeling to compare ventilated packaging types for strawberries from farm to retailer*, Food Packaging and Shelf Life 34, 100944. DOI: 10.1016/j.fpsl.2022.100944.

The implemented strawberry profile uses the paper's first-order remaining fruit-quality formulation with Arrhenius temperature dependence and the reported calibration parameters documented in `QUALITY_LIFE_MODEL.md`.

## Supporting literature

Dynamic strawberry quality modeling under fluctuating temperatures is also supported by later work such as Xing et al. (2025), *Development of a dynamic predictive model for quality changes in strawberries under fluctuating temperatures*, Journal of Food Science, DOI 10.1111/1750-3841.70149.

This supporting paper is not used to invent coefficients in the current profile.

## ColdTrace training data is different

The trained ColdTrace risk model uses:

- `NifferLi/Cold-Chain-Transportation-Strawberry`
- local benchmark `backend/data/ALL_benchmark_W60.parquet`
- 14,398 processed rows
- six independent commercial strawberry shipments
- nine original temperature channels
- target `y_next_120_R2`

That dataset does **not** provide measured remaining-quality-life labels, firmness-at-destination labels, rejection dates or verified shelf-life outcomes.

Consequently, the Quality-Life Engine is not described as AI trained from those shipments.

## Future learned RQL model

A defensible learned model would require paired telemetry and measured outcomes such as initial product age/quality, variety, packaging, temperature/RH history, arrival firmness/decay/weight loss and actual time to quality rejection.

Future methods may include survival analysis, accelerated-failure-time models, gradient boosting, or a hybrid physics model plus learned residual correction.
