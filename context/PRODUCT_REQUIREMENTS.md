# Product Requirements

## Primary user goal

A cold-chain operator should be able to glance at the phone and understand:

- whether the sensor node is connected;
- whether current conditions look normal;
- current temperature and humidity;
- current air/VOC-related condition at a useful summary level;
- whether any sensor is warming, unavailable, or untrustworthy;
- whether conditions are trending toward a problem;
- whether an abnormal event is active;
- what happened recently.

The app should expose deeper technical data only when the user asks for it.

## Required product surfaces

### Live

Must provide:
- BLE/device connection state;
- concise overall condition state;
- temperature as the highest-priority environmental measurement;
- humidity;
- air/VOC condition;
- recent trend;
- active warning/event state;
- clear sensor-readiness behavior;
- access to metric detail.

Optional if useful and not cluttering:
- recent rate of change;
- simple elapsed-event duration;
- last telemetry timestamp.

### Metric detail

Temperature detail:
- current value;
- threshold/profile;
- recent trend;
- recent min/max or range;
- rate of change if implemented;
- relevant events.

Humidity detail:
- current value;
- recent trend;
- simple interpretation only if scientifically honest.

Air/VOC detail:
- ENS160 AQI;
- TVOC;
- eCO2 clearly labeled as equivalent/estimated;
- MQ-135 raw or normalized/relative response;
- sensor state/warm-up;
- no exact-gas identity claims.

### History / events

Must support:
- chronological event timeline;
- event type;
- start time;
- severity;
- peak/relevant measurement;
- recovered/active state;
- ability to open an event for more detail;
- empty state when nothing has happened.

Do not invent "previous accidents" as factual records. Demo mode may include simulated historical events, clearly part of the demo dataset.

### Device / sensor health

Must show:
- overall node connection;
- DHT22 status;
- ENS160 status: warming/ready/fault where available;
- MQ-135 status: stabilizing/baseline/active/fault where the firmware/app can support it;
- last update time;
- app/firmware protocol version if practical;
- connection/reconnect action.

### Settings

Must include only settings that serve real use:
- temperature warning threshold or profile;
- baseline/re-baseline for relative gas signal if supported;
- demo mode/scenario access;
- reset demo/local history if needed;
- units only if implemented completely.

Avoid a settings graveyard full of nonfunctional toggles.

## Android requirement

This must become an actual Android package, not only a PWA.

Target:
- React/Vite/TypeScript web core;
- Capacitor native Android wrapper;
- `@capacitor-community/bluetooth-le` native BLE central plugin;
- debug APK produced in a documented location;
- install and launch verified on an Android emulator;
- non-radio flows interacted with in the emulator.

Real Bluetooth radio behavior still requires morning physical device verification unless a reliable virtual BLE path is established without risking the schedule.

## Web/showcase requirement

A desktop/web showcase must render the real app inside a phone-sized presentation surface. It is not a separate fake interface.

The same state/domain/components should be used.

Showcase must:
- run deterministic demo scenarios;
- look credible on a laptop/projector;
- remain responsive;
- allow the user to demonstrate normal -> excursion -> warning -> history without hardware;
- avoid exposing debug controls in a way that looks like the main product.

## Transport architecture

App logic must not depend directly on one BLE implementation.

Required abstraction:
- MockTransport for deterministic tests/demo;
- NativeBleTransport for Capacitor Android;
- WebBleTransport only if it is low risk/useful.

Every transport must feed the same decoded telemetry/domain events into the app.

## Failure behavior

Required UX behavior:
- Bluetooth off;
- permission denied;
- no device found;
- connection timeout/failure;
- disconnect during use;
- reconnect;
- telemetry stops arriving;
- malformed/unsupported packet;
- DHT22 fault;
- ENS160 fault/warm-up;
- stale data.

Errors should guide the user to the next action, not dump stack traces or technical paragraphs.

## Scientific truth requirements

Never present:
- MQ-135 raw value as exact NH3/NO2/CO concentration;
- ENS160 eCO2 as direct CO2 measurement;
- anomaly score as validated spoilage probability;
- air-quality change as proof of microbiological spoilage;
- prototype output as food-safety certification;
- printed expiry extension;
- "AI predicted remaining shelf life" unless a validated product-specific model is actually added and evidenced.

Acceptable framing:
- condition anomaly;
- environmental excursion;
- relative gas/VOC response;
- air-quality/VOC trend;
- risk/watch state;
- prototype heuristic.

## Judge-demo reliability priorities

Priority order:
1. app launches every time;
2. demo mode is deterministic;
3. Android package installs;
4. real BLE path compiles and matches firmware;
5. live sensor demo works;
6. deeper features.

Do not sacrifice 1-4 to chase optional ML or elaborate sensor chemistry.
