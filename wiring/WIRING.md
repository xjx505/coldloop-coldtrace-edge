# ColdLoop physical wiring

Target board profile used by the firmware: ESP32-C3 DevKit-compatible / SuperMini-style board.

## Planned GPIO map

| Device | Module pin | ESP32-C3 |
|---|---|---|
| DHT22 | DATA | GPIO4 |
| ENS160 | SDA / D | GPIO6 |
| ENS160 | SCL / C | GPIO7 |
| MQ-135 | AOUT through divider | GPIO0 (ADC) |

All grounds must be common.

## DHT22

- VCC -> 3.3V
- GND -> GND
- DATA -> GPIO4
- If this is a bare 4-pin DHT22 rather than a breakout module, add ~10k pull-up from DATA to 3.3V.

## ENS160 (DFRobot Gravity-style board)

- + -> 3.3V
- - -> GND
- D / SDA -> GPIO6
- C / SCL -> GPIO7

The firmware probes both supported I2C addresses, 0x53 and 0x52.

## MQ-135 module

- VCC -> 5V
- GND -> GND
- AOUT -> voltage divider -> GPIO0
- DOUT is unused

Do NOT connect a potentially 5V AOUT directly to the ESP32-C3 ADC.

Recommended divider:
- R1 = 10k between MQ-135 AOUT and GPIO0
- R2 = 20k between GPIO0 and GND

At a 5.0V sensor output, this produces about 3.33V at GPIO0.

Diagram:

MQ-135 AOUT ---- 10k ----+---- GPIO0
                         |
                        20k
                         |
                        GND

## First physical bring-up order

1. Power ESP32-C3 alone and confirm Serial boot.
2. Connect DHT22 only and verify temperature/humidity.
3. Power ENS160 and verify I2C detection.
4. Add MQ-135 power and its divider, then verify ADC stays in range.
5. Confirm serial telemetry.
6. Confirm BLE connection from the phone app.
7. Only then put sensors near food / inside the test chamber.

Important: the MQ-135 heater draws meaningful current. Power it from the board's 5V/USB rail only if that rail can supply it; never from a 3.3V GPIO pin.
