# ColdLoop Final App Polish Directive

This document is a binding finishing directive for the ColdLoop app. It is additive to the existing project instructions, QA gates, UX specification, interaction matrix, and scientific-truth rules.

The goal is not to redesign the product. The current app already has a strong visual foundation. The job is to make the final product more reliable, more presentation-ready, more accessible, and safer if the physical ESP32/BLE demo fails.

## 1. Preserve what already works

Do NOT replace the current visual language with a new theme.

Keep:
- warm-neutral / light interface;
- charcoal typography;
- restrained green for healthy state;
- amber for caution;
- red only for meaningful warnings;
- clear temperature-first hierarchy;
- bottom navigation;
- useful trend chart;
- event/history model;
- sensor-health model;
- minimal visible text with progressive disclosure.

Do not add:
- dark navy or purple AI-dashboard styling;
- decorative gradients/blobs/particles;
- radial gauges without information value;
- emoji UI;
- unnecessary cards;
- decorative charts;
- long explanatory text blocks.

Every visual must communicate state, magnitude, trend, threshold, history, health, or action.

## 2. Physical-hardware failure must not kill the demo

The ESP32-C3, BLE link, sensors, or physical phone connection may fail on demo day.

The app must therefore have a polished deterministic simulation/demo mode that can demonstrate the full product flow without physical hardware.

This is not a fake second application.

The simulation must feed the SAME product pipeline used by real telemetry:
- same packet decoder or equivalent shared telemetry model;
- same event logic;
- same warning logic;
- same history;
- same UI;
- same navigation;
- same state transitions.

Required presentation flow:

Normal
-> temperature begins rising
-> threshold / rate condition becomes abnormal
-> warning appears
-> event is recorded
-> user can inspect the event
-> condition recovers
-> history shows the completed event

If possible, include a VOC/air-quality scenario too, but do not sacrifice the core temperature demo.

The fallback must work offline and without external cloud services.

## 3. Make demo mode look like a real product fallback

Current demo labeling is too repetitive in some states.

Do not show multiple simultaneous labels such as:
- Demo
- Demo connected
- DEMO badge

Use one clear, subtle indication such as:
- "Simulated data"
or
- "Demo mode"

The user must never be misled into thinking simulated data is physical sensor data, but the interface should not scream "fake prototype" across the whole screen.

Avoid using warning-like yellow styling for the demo-mode label if yellow is already a caution semantic.

## 4. Presenter / showcase mode

The current desktop showcase is useful for QA but too exposed for judges because it shows many engineering failure scenarios at once.

Create a judge-facing presenter mode using the REAL app UI inside the phone frame.

Default visible presenter controls should be simple:
- Normal
- Excursion
- Recovery

Optionally:
- Air/VOC change

Move engineering test cases behind an "Advanced scenarios" control:
- malformed packet;
- Bluetooth off;
- permission denied;
- no device;
- timeout;
- DHT fault;
- ENS fault;
- paused telemetry;
- connection failure;
- other QA-only cases.

The phone should be visually dominant on the desktop showcase. Enlarge it relative to the overall canvas so judges can actually read it from a laptop/projector.

Do not create a separate fake presentation UI.

## 5. Device page cleanup

The Device screen is useful but currently exposes protocol-level information too prominently.

Keep the main Device screen focused on:
- node connection;
- DHT22 readiness/fault;
- ENS160 warming/ready/fault;
- MQ-135 stabilizing/baseline/fault;
- last telemetry/update;
- reconnect action where useful.

Move technical details such as:
- "20-byte packed little-endian";
- raw protocol metadata;
- UUID details;
- transport internals;

into an expandable "Connection details" or "Technical details" area.

Do not remove technical information. Re-rank it.

## 6. Settings cleanup

Settings is visually weaker than Live / History / Device.

Improve:
- header consistency with the rest of the app;
- spacing;
- hierarchy;
- demo controls;
- grouping of threshold / baseline / demo functions.

Do not add settings that do not actually work.

The deterministic demo controls should feel deliberate, not like a developer panel accidentally shipped to users.

## 7. Secondary-text readability

Some secondary labels are too small or too low-priority visually.

Review:
- AQI helper text;
- relative-humidity labels;
- chart labels;
- timestamps;
- event metadata;
- small helper text;
- device technical labels.

Increase readability where needed without making the interface text-heavy.

Do not reduce information density. Improve hierarchy and legibility.

## 8. Accessibility pass

Accessibility is a real product-quality requirement, not a marketing badge.

Implement practical improvements:

### 8.1 Color-independent meaning

Never communicate warning/health state by color alone.

Use combinations of:
- text;
- icon;
- label;
- shape;
- color.

Examples:
- "Temperature above threshold"
- "Sensor warming"
- "Disconnected"
- "Ready"

### 8.2 Contrast

Verify meaningful text and controls have sufficient contrast against their background.

Pay special attention to:
- muted gray text;
- disabled controls;
- warning labels;
- helper text;
- chart labels.

### 8.3 Touch targets

Primary interactive controls should be approximately 44–48 CSS px minimum in usable hit area.

Check:
- bottom navigation;
- back buttons;
- icon-only controls;
- detail arrows;
- Connect;
- retry;
- scenario buttons;
- settings controls.

### 8.4 Screen-reader / semantic labels

Icon-only actions must have meaningful accessible names.

Examples:
- Back
- Open settings
- Open history
- Open temperature details
- Connect sensor
- Retry connection
- Run demo scenario

Use semantic HTML / ARIA only where appropriate. Do not add meaningless ARIA noise.

### 8.5 Text scaling / layout resilience

The UI should remain usable when text is larger.

At minimum test browser/system text scaling where practical and ensure:
- buttons do not clip;
- bottom nav does not overlap;
- values do not overflow;
- cards expand gracefully.

### 8.6 Reduced motion

Respect reduced-motion preferences where practical.

Animations should already be:
- short;
- non-blocking;
- not required to understand state.

Do not add an "Accessibility Mode" marketing toggle unless there is a real functional need.

## 9. Warning behavior

Warnings must remain specific and trustworthy.

Prefer:
"Temperature rising"
"9.2 °C · above 8.0 °C for 2 s"

Avoid:
"ANOMALY DETECTED"

Do not trigger a dramatic warning from one obviously noisy sample.

Use the existing smoothing / sustained-threshold / rate-of-rise logic as appropriate.

Normal state should remain calm.

## 10. Required quality-control loop

Do NOT mark this directive complete from source review or tests alone.

Required loop:

1. implement;
2. run;
3. interact;
4. capture screenshots;
5. inspect screenshots as a connected journey;
6. record defects;
7. fix;
8. regenerate screenshots;
9. repeat until P0/P1 visual defects are gone.

Required viewports:
- 360x800
- 390x844
- 412x915
- Android emulator
- desktop showcase

Required visual states:
- disconnected;
- connected normal;
- temperature rising;
- warning;
- active event;
- recovered event in history;
- Device;
- Settings;
- connection timeout;
- demo/simulation mode;
- presenter/showcase normal;
- presenter/showcase warning.

## 11. Simulation fallback acceptance test

The project must pass this exact fallback test without physical hardware:

1. launch app;
2. enter deterministic demo mode;
3. start Normal;
4. verify calm normal state;
5. trigger Excursion;
6. verify temperature/trend rises;
7. verify warning appears;
8. verify one event is created, not duplicated each sample;
9. open History;
10. open the event;
11. trigger Recovery;
12. verify the event resolves;
13. confirm history remains;
14. disable demo mode cleanly.

This path must work in the Android build and in the web/showcase build using the same shared product logic.

## 12. Physical BLE remains separate

Do not fake physical BLE success.

If physical ESP32/phone BLE has not been tested, keep that status explicitly physical-required.

But make sure tonight:
- native BLE code compiles;
- service UUID matches firmware;
- characteristic UUID matches firmware;
- packet decoding is tested;
- disconnect/reconnect code exists;
- malformed/stale data paths are handled.

## 13. Final visual priorities

Priority order:

P1
- polished deterministic simulation fallback;
- simplified presenter/showcase controls;
- larger phone in showcase;
- reduce duplicate demo labeling;
- no visual regression of Live/History.

P2
- Device page technical-detail re-ranking;
- Settings cleanup;
- small-text readability;
- accessibility pass;
- reduced-motion / text-scale resilience.

Do not spend time on decorative polish before P1 work is complete.

## 14. Completion rule

This directive is complete only when:
- simulation fallback works end-to-end;
- presenter mode is cleaned up;
- duplicate demo labeling is resolved;
- Device technical details are de-emphasized;
- Settings is visually consistent;
- accessibility checks are implemented and tested;
- final screenshots were regenerated after the last meaningful UI change;
- no unresolved P0/P1 visual/usability defect remains;
- physical-only items are not falsely marked verified.

Do not redesign the product unnecessarily. Finish it.

## 15. Deep independent review additions

Before final completion, also resolve the findings documented in `qa/COLDTRACE_OFFLINE_AI_INTEGRATION_PLAN.md`, especially:
- temperature-card state must remain temperature-specific;
- modal/detail views must implement real modal focus behavior and focus restoration;
- default Capacitor launcher/splash assets and empty favicon must be replaced with project branding;
- transport switching must not allow BLE, Demo, or future AI-replay sources to mutate each other's active events;
- Air/VOC event details must report the actual trigger semantics rather than always implying a 700 ppb breach;
- judge-facing product language must not imply the current DHT22/ENS160/MQ-135 node is a valid EDGE-3 predictive-AI input;
- presenter mode, small-text legibility, Device technical hierarchy, Settings hierarchy, and duplicate Demo disclosure remain finishing items.

## 16. ColdTrace offline AI planning gate

A verified portable ColdTrace EDGE-3 AI bundle now exists, but it is NOT yet integrated into this Android app.

Read:
`qa/COLDTRACE_OFFLINE_AI_INTEGRATION_PLAN.md`

Do not begin AI integration merely because the bundle exists. The user explicitly requires a planning/discussion pass first.

The predictive model requires three specific EDGE-3 temperature positions and a seven-row / 60-minute / ten-minute-cadence history. The current DHT22/ENS160/MQ-135 node is not compatible input and must never be coerced into fake EDGE-3 predictions.

When the user approves integration, inference must remain fully local in the Capacitor app, use the all-six production model for normal inference, isolate the S2 model to explicitly labelled evaluation replay, preserve deterministic hardware-fallback simulation, and pass bundle parity/offline tests before any predictive UI is treated as complete.

The approved execution authority and efficient QA sequence are defined in:
`qa/COLDTRACE_AI_MASTER_EXECUTION_PLAN.md`

Follow that plan instead of improvising a second architecture.
