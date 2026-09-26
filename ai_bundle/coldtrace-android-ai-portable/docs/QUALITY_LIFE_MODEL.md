# ColdLoop Quality-Life Engine

## Purpose

The Quality-Life Engine is separate from the trained ColdTrace thermal-risk AI.

ColdTrace Risk AI asks:

> Will processed severe thermal state R2 occur within the next 120 minutes?

The Quality-Life Engine asks:

> How much reference-equivalent product quality life has the observed time-temperature history consumed?

It is a **literature-calibrated kinetic model**, not a learned shelf-life model trained from the six ColdTrace shipments.

## Strawberry v1 model

Profile: `quality_life/profiles/strawberry_v1.json`

The implementation follows the first-order remaining-fruit-quality model reported by Schudel et al. (2022):

`-dI_f/dt = k(T) I_f`

with Arrhenius temperature dependence:

`k(T) = k0 exp(-Ea / RT)`

Profile parameters:

- initial quality index: 100%
- end-of-quality threshold: 20%
- `k0 = 3.55e6 s^-1`
- `Ea = 65 kJ/mol`
- gas constant in SI units
- reference temperature: 0°C
- literature calibration range used for the profile: 0–20°C
- resulting reference shelf life from the equation: approximately 14.1 days at 0°C

The literature calibration is approximately 14 days at 0°C, 5 days at 10°C and 2 days at 20°C.

Source: Schudel et al., *Combining experiments and mechanistic modeling to compare ventilated packaging types for strawberries from farm to retailer*, Food Packaging and Shelf Life 34 (2022) 100944. DOI: 10.1016/j.fpsl.2022.100944.

## Integration

Each probe is integrated independently over time. For each interval, the implementation uses the mean of the two endpoint temperatures and integrates the Arrhenius degradation rate. This is a discrete endpoint-mean approximation; the literature simulation reports 10-minute output intervals.

Intervals longer than 20 minutes are excluded from measured exposure and temporal coverage. This allows one missed 10-minute sample but does not treat sparse endpoints as evidence of continuous storage conditions. A detected long gap, or a missing interval on an otherwise eligible probe, marks the result `DEGRADED_TEMPORAL_COVERAGE` and suppresses absolute RQL. Absolute RQL also requires at least two eligible probe positions; with one probe the observed age remains available but spatial coverage is degraded and absolute RQL is suppressed. The browser shows the time-coverage percentage alongside the eligible-probe count. Fleet Operations does not currently display a Quality-Life result.

Damage is expressed as **equivalent quality age at the 0°C reference condition**.

For logistics decision support, the aggregate uses the worst eligible probe, provided sufficient time coverage exists. The result also exposes the best-to-worst probe span as a sensitivity range.

## Absolute RQL versus observed exposure impact

ColdTrace transportation telemetry does not tell us the product's quality at harvest or at the start of the logged journey.

Therefore, without an external starting-quality input, the engine reports only:

- observed reference-equivalent quality age;
- additional quality-life cost compared with the 0°C reference exposure.

It does not fabricate absolute days remaining.

The Driver demo contains an explicitly labeled **simulated operator input** for starting RQL, default 10 days, to demonstrate how an externally supplied starting state could be reduced by observed thermal exposure.

When that input exists:

`estimated remaining RQL = external starting RQL - conservative observed equivalent quality age`

This is not a legal expiration date or food-safety determination.

## Guardrails

- unsupported temperatures outside the prototype -5°C to 30°C range are rejected;
- timestamps must be strictly increasing;
- intervals over 20 minutes are excluded; long or missing eligible-probe intervals degrade temporal coverage;
- missing probes reduce spatial coverage;
- one eligible probe is reported as degraded spatial coverage;
- absolute RQL is unavailable unless starting RQL is externally supplied, at least two probes are eligible, and temporal coverage is intact;
- rescue routing always requires human approval;
- QA not approved or an unresolved hold blocks routing recommendations; negative and non-finite RQL values are rejected.

## Validation

Python and JavaScript implementations are parity-tested.

Synthetic constant-temperature checks:

- 24 h at 0°C = 1.00 reference-equivalent day
- 24 h at 10°C = 2.75 reference-equivalent days
- 24 h at 20°C = 7.05 reference-equivalent days

The independent reference reproduction gives 14.1149 days at 0°C (+0.82% versus the paper's approximate 14 days), 5.1369 days at 10°C (+2.74% versus approximate 5 days), and 2.0029 days at 20°C (+0.15% versus approximate 2 days). These are calculations from the selected equation, not measured ColdTrace shipment shelf-life outcomes.

These ratios are consistent with the selected Arrhenius model.

This prototype has not been prospectively validated against measured remaining-quality outcomes from the ColdTrace shipment dataset because those labels do not exist in that dataset.
