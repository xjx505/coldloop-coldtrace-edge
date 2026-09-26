# Open Questions Before Slide Construction

These are facts we do not currently have enough evidence to settle. Do not guess.

## Competition / presentation

1. Exact finalist pitch duration.
2. Whether Q&A is included inside or after that duration.
3. Whether finalists must use exactly the submitted 7–10 slide file.
4. Presentation screen/projector native resolution and room sightlines.
5. Whether embedded video is reliable/allowed in the final setup.

None of these block research. The future deck should be robust to uncertainty.

## Project truth

There are currently competing narratives in local materials:

### Older ColdLoop implementation context
- ESP32-C3;
- DHT22 + MQ-135 + ENS160;
- 20-byte BLE telemetry;
- Capacitor Android operator app;
- condition-monitoring/event-history framing.

### Newer ColdTrace Edge team handoff
- real strawberry cold-chain dataset;
- on-device ML early warning;
- EDGE-3 temperature sensor concept;
- different BLE packet description;
- PWA/edge + cloud-history architecture;
- excursion forensics / weak-point analysis.

Before presentation copy is written, inspect the actual current implementation/artifacts and answer:

1. Which app is the judged prototype?
2. Which model is actually running in that app?
3. Which sensor configuration is actually used in the physical demo?
4. Which BLE protocol is current?
5. Which results were actually reproduced by the team?
6. Which screenshots correspond to the current product?
7. Which architecture is implemented vs. aspirational?
8. Which project name should be used consistently: ColdLoop, ColdTrace Edge, or another final naming scheme?

## Evidence

Need final canonical list of:
- dataset provenance;
- model task;
- independent evaluation unit;
- selected metrics;
- limitations;
- current APK/PWA status;
- physical hardware verification;
- offline validation;
- open-source repo/license status;
- any measured vs modeled sustainability outcome.

## Bad deck

The previously generated low-quality PowerPoint mentioned by the user has not yet been located/verified in the obvious ColdLoop/Downloads paths.

Do not critique specific slide numbers or claim to have inspected it until its actual file is found.
