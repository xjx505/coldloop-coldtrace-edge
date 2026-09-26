# ColdLoop Larger System Model

The overnight app/hardware node is an MVP surface of a larger cold-chain decision-support concept. Preserve this context for product copy, demo storytelling, and future features, but do not overbuild it tonight.

## Closed loop

SENSE -> UNDERSTAND -> PREDICT -> DIAGNOSE -> COMPARE/SIMULATE -> DECIDE -> ACT -> LEARN

## Fast loop: one shipment/truck

Potential input classes:
- cargo/air temperature;
- humidity;
- relative VOC/gas response;
- reefer setpoint;
- supply-air temperature;
- return-air temperature;
- door state;
- GPS;
- speed/stationary state;
- reefer alarms;
- product requirements;
- handling event;
- cargo position/zone;
- location/time;
- route/storage/transport records.

Potential stages:
1. detect abnormal state;
2. forecast near-term condition risk;
3. infer likely operational cause only where evidence is sufficient;
4. compare feasible operator actions;
5. rank/recommend;
6. human approves or existing system executes.

## Slow loop: across trips

Aggregate historical events to identify recurring weak points by route, loading stage, dock, handoff, time of day, equipment, repeated procedure, and recurring excursion type. Then recommend process improvement and observe whether recurrence falls.

## Cause-pattern examples

These are hypotheses requiring the relevant independent signals.

Door exposure:
- door open;
- stationary/loading context;
- temperature rise;
- humidity shift;
- reefer otherwise normal.

Reefer issue:
- door closed;
- setpoint plausible;
- supply/return temperature deteriorate;
- alarm or equipment signal.

Wrong setpoint:
- setpoint change;
- cargo/air temperature follows;
- no equipment failure evidence.

Airflow/load imbalance:
- reefer overall normal;
- localized cargo zone deviates.

A single temperature sensor cannot uniquely diagnose all causes.

## Operator action library

Only recommend actions the operator can actually take within policy:
- verify/close door;
- finish load/unload promptly;
- verify/restore approved setpoint;
- maintenance escalation;
- backup refrigeration procedure;
- move to approved cold storage;
- inspect airflow/load arrangement;
- prioritize next approved handling step;
- continue monitoring if no intervention is warranted.

Do not recommend arbitrary cross-company transfers or actions requiring cooperation that does not already exist.

## Current MVP mapping

The current physical node provides temperature, humidity, ENS160 air/VOC-related outputs, MQ-135 relative gas/VOC response, time/sequence, and sensor health.

Therefore the current app can honestly support:
- live condition monitoring;
- trend detection;
- environmental excursion alerts;
- relative air/VOC changes;
- event history;
- sensor health;
- deterministic demo scenarios.

It cannot by itself honestly support:
- route-based diagnosis;
- door-open diagnosis;
- reefer compressor diagnosis;
- GPS/location analysis;
- validated shelf-life prediction;
- physical root-cause classification.

Those need additional telemetry/data.

## Differentiation framing

Do not claim monitoring, prediction, explanation, or action ranking individually are novel.

Potential differentiation:
"vendor-neutral/open cold-chain event integration + operational cause reasoning + feasible intervention ranking + recurring weak-point learning."

Open-source/open-standard alignment can eventually use GS1 EPCIS 2.0 for event interoperability.

## MVP story to judges

The hardware node is not "the AI." It is the trustworthy sensing edge of the system.

The demo proves open sensor acquisition, edge telemetry, phone connectivity, useful operator UX, anomaly/event loop, explicit sensor confidence/readiness, and a foundation for richer decision support when reefer/door/location/handling records are connected.
