# ColdLoop Project Context

## Event and deadline

Project: Reboot The Earth Doha 2026, Challenge 2: AI for Cold-Chain Monitoring and Food-Loss Reduction.

Event dates: September 23-26, 2026, Doha, Qatar. Submission deadline on September 26 is 1:45 PM. Science fair begins around 2:00 PM, followed by finalist pitches and awards.

The user is responsible for the hardware/demo/app side and needs a credible live demonstration in front of judges. The practical morning goal is to wire the sensors, flash the ESP32-C3, install/open the Android app, connect by BLE, and show live measurements changing in response to a safe physical disturbance such as warm air.

## Challenge framing

The challenge asks teams to combine cold-chain-relevant inputs such as sensor readings, product information, location/time, transport records, and storage records to detect issues, estimate risk/shelf-life where supportable, issue alerts, and recommend practical actions.

ColdLoop should be positioned as a vendor-neutral/open cold-chain decision-support system. The current hardware node is one data source within that larger system, not the entire system.

Conceptual loop:

SENSE -> UNDERSTAND -> PREDICT -> DIAGNOSE -> SIMULATE/COMPARE -> DECIDE -> ACT -> LEARN

Fast loop:
live cargo/environment/refrigeration/logistics signals -> abnormal-state detection -> risk forecast -> likely operational cause where supported -> feasible action ranking -> human/operator action.

Slow loop:
historical events/trips -> recurring weak points by route/dock/loading/handoff/equipment/time/procedure -> process improvement.

For the hackathon demo, the user-facing app should honestly demonstrate the SENSE/UNDERSTAND/ALERT portion with useful condition monitoring and event history. Do not fabricate unvalidated physical-cause diagnosis or spoilage probabilities merely because the larger concept includes them.

## Product thesis

Working description:

"An explainable cold-chain decision system that fuses cargo, refrigeration, location and handling data to predict abnormal conditions, determine the most likely operational cause, compare feasible corrective actions, and learn recurring weak points across trips."

The sensor node feeds cargo-condition data into this larger system.

## Hard scope guardrails

- One operator / one fleet / existing contracted route network.
- No arbitrary cross-company rerouting assumptions.
- Printed/legal expiry remains a hard constraint; do not extend expiry or claim food safety.
- Only recommend actions the operator can realistically take.
- Human-in-loop for operational controls.
- Rules remain rules. Use AI only when it adds value.
- Do not claim novelty in the generic sequence predict -> explain/diagnose -> recommend, because related academic and commercial systems already exist.
- Do not claim the prototype proves X% food-waste reduction.
- Do not claim a toy/synthetic model proves real-world spoilage accuracy.

Kill rule inherited from project discussions:

"If the solution requires companies to cooperate that do not already cooperate, assumes an unverified major source of Qatar loss, uses AI where a two-line rule works, or overrides existing food-safety/expiry procedures, kill it."

## Hardware being targeted

ESP32-C3 microcontroller.
DHT22 temperature/humidity sensor.
MQ-135 broad metal-oxide gas/VOC-response module.
DFRobot/Gravity ENS160 digital multi-gas/VOC air-quality sensor.

MQ-135 is a broad, cross-sensitive MOX sensor. Treat it as a relative pattern/trend channel. Do not label its ADC number as a specific gas concentration without calibration/validation.

ENS160 outputs include AQI, TVOC, and eCO2 estimates. eCO2 is not direct NDIR CO2 measurement. Use sensor warm-up/readiness state and do not present warm-up values as authoritative.

DHT22 is adequate for a prototype but is not industrial cold-chain instrumentation.

## Existing implementation before overnight Codex run

Repository:
`<LOCAL_USER_PATH>\Documents\ColdLoop`

Existing firmware:
- PlatformIO target for ESP32-C3 DevKit-compatible board.
- DHT22 on GPIO4.
- MQ-135 analog input on GPIO0.
- ENS160 planned over I2C GPIO6/GPIO7.
- serial JSON diagnostics;
- BLE device name `ColdLoop-01`;
- 128-bit service/telemetry UUIDs;
- exact 20-byte packed telemetry payload;
- simple heuristic anomaly score;
- hardware and Wokwi build modes.

Existing web prototype:
- plain HTML/CSS/ES modules;
- BLE packet decoder;
- Web Bluetooth path;
- deterministic demo data;
- live cards/chart;
- basic PWA manifest/service worker;
- tests for packet decoding/demo behavior.

Previous verification:
- hardware firmware build passed;
- Wokwi firmware build passed;
- Node tests passed 3/3;
- local web app served successfully;
- browser demo mode ran;
- wiring/test documentation exists.

This is a technical skeleton, not the final product UX. The final overnight work may replace/restructure `app/`, but should preserve useful decoding/protocol logic and compatibility.

## Raw historical record

The complete exported ChatGPT discussion is:

`ChatGPT-Cold Chain Concept Compare-20260925-2213.md`

It contains the ideation history, red-team analysis, hardware decisions, research links, user design preferences, and prior implementation actions. Use structured context files first, then consult the archive if a detail is missing.

## Judge demo intent

Preferred live demo:

1. Android phone has ColdLoop app installed.
2. ESP32-C3 sensor node is powered from USB/battery.
3. App connects to `ColdLoop-01` by BLE.
4. Judges see calm normal-state readings.
5. User applies safe warm air / a warm object near the temperature sensor.
6. Temperature trend visibly rises.
7. A warning appears based on sustained threshold and/or strong rate-of-rise logic, not a single noisy sample.
8. Event is recorded in History.
9. Removing the disturbance shows recovery.
10. App remains understandable without verbal narration.

Fallback:
- If real BLE fails, serial output proves hardware telemetry and deterministic app demo mode demonstrates the software/product flow.
- If one gas sensor is unreliable, DHT22 + remaining sensor still provides a demo.
- Never fake physical success.
