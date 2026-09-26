# Hardware and Protocol Context

## Physical node

Target controller: ESP32-C3, likely SuperMini/DevKit-compatible.

Sensors:
- DHT22 temperature/humidity;
- MQ-135 analog metal-oxide air/gas response module;
- DFRobot/Gravity ENS160 digital MOX air-quality/VOC sensor.

The morning physical board may differ slightly in silk labels/pin availability. Keep GPIO mapping centralized so it can be changed once without rewriting drivers.

## Current planned GPIO map

- DHT22 DATA -> GPIO4
- MQ-135 divided AOUT -> GPIO0 ADC
- ENS160 SDA -> GPIO6
- ENS160 SCL -> GPIO7
- common ground

These are current firmware defaults, not sacred. Verify against the actual board before final physical wiring.

## Electrical safety

DHT22:
- typically 3.3V logic;
- bare 4-pin sensor may need a pull-up on DATA;
- breakout modules may already include it.

ENS160 breakout:
- use the exact DFRobot breakout requirements;
- connect over I2C;
- firmware probes supported 0x53 then 0x52.

MQ-135:
- heater module commonly powered from 5V;
- do NOT assume AOUT is safe for ESP32 3.3V ADC;
- current wiring doc uses a divider:
  AOUT -> 10k -> ADC node -> 20k -> GND
  which maps 5V to about 3.33V;
- verify actual module output before trusting;
- never power heater from a GPIO.

## Sensor truth constraints

### DHT22

Useful for hackathon temperature/humidity, not industrial instrumentation.

Respect its slow sample cadence. Current firmware uses approximately 2 s interval.

### MQ-135

Broad, cross-sensitive MOX element.

Valid uses:
- raw ADC;
- normalized relative response;
- trend/slope;
- pattern input when paired with other sensors.

Invalid uses without calibration/validation:
- exact NH3/NO2/CO concentration;
- exact gas identification;
- direct spoilage percentage;
- food-safety decision.

Warm-up/stabilization matters. Do not make the morning demo depend on a laboratory-calibrated MQ-135 number.

### ENS160

Digital MOX multi-gas/air-quality sensor.

Expected useful outputs:
- AQI;
- TVOC;
- eCO2 equivalent;
- operating/warm-up status.

eCO2 is an estimate based on VOC behavior, not direct CO2 measurement.

Temperature/humidity compensation should use DHT22 values when available.

Warm-up/readiness must be reflected in app state.

## BLE identity

Device name:
`ColdLoop-01`

Service UUID:
`6d6f0001-7c62-4f44-a4d2-0c5a9b2bca01`

Telemetry characteristic UUID:
`6d6f0002-7c62-4f44-a4d2-0c5a9b2bca01`

Characteristic supports READ + NOTIFY in current firmware.

## Telemetry packet

Current packed payload is exactly 20 bytes, little-endian:

- offset 0, uint16: sequence
- offset 2, int16: temperature x100
- offset 4, uint16: humidity x100
- offset 6, uint16: MQ-135 raw ADC
- offset 8, uint16: ENS160 TVOC ppb
- offset 10, uint16: ENS160 eCO2 ppm equivalent
- offset 12, uint8: ENS160 AQI
- offset 13, uint8: ENS160 raw status
- offset 14, uint8: anomaly score 0..100
- offset 15, uint8: flags
- offset 16, uint32: uptime ms

Current flags:
- bit 0: temperature high
- bit 1: MQ-135 relative rise
- bit 2: TVOC high
- bit 3: DHT22 fault
- bit 4: ENS160 fault
- bit 5: MQ-135 has formed a relative baseline from 30 nonzero ADC readings; this is not physical warm-up or gas calibration

The exact 20-byte size avoids depending on a larger negotiated BLE MTU.

## Current firmware behavior

- serial at 115200;
- JSON telemetry printed for debugging;
- DHT22 acquired periodically;
- ENS160 environment compensation written when available;
- ENS160 hardware mode reads standard registers;
- simulation mode provides deterministic ENS160 values;
- MQ-135 baseline established from early samples and slowly tracks drift;
- simple heuristic anomaly score;
- BLE notification of packed telemetry.

Do not present the firmware heuristic as validated science.

## Recommended overnight protocol work

- create golden binary packet fixtures;
- verify app decoder against fixtures;
- verify firmware struct size/static assert;
- add explicit protocol version only if it can be done without destabilizing compatibility;
- improve sensor readiness/staleness semantics if needed;
- preserve serial JSON;
- ensure UI does not treat warm-up/fault as valid measurement.

## Morning bring-up order

1. ESP32 alone -> serial boot.
2. DHT22 -> finite temperature/humidity.
3. ENS160 -> address and valid status.
4. MQ-135 -> divider, safe ADC voltage, changing raw signal.
5. serial telemetry.
6. BLE advertising.
7. Android connection and notifications.
8. live UI.
9. safe temperature disturbance.
10. event/history/recovery.

Never connect MQ-135 AOUT directly until voltage safety is known.
