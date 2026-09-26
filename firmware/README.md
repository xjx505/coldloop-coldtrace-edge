# ColdLoop firmware

Target: ESP32-C3 + DHT22 + MQ-135 + ENS160.

## Current pin plan
- DHT22 DATA -> GPIO4
- MQ-135 AOUT (through voltage divider) -> GPIO0
- ENS160 SDA -> GPIO6
- ENS160 SCL -> GPIO7
- Common ground

These pins are centralized in include/config.h and can be changed after the exact ESP32-C3 board is in hand.

## Builds
- hardware: real DHT22, MQ-135 ADC, real ENS160 over I2C
- wokwi: real simulated DHT22 + simulated ENS160 values + potentiometer on GPIO0 as MQ-135 analog stand-in

The BLE telemetry packet is exactly 20 bytes for reliable notifications.
