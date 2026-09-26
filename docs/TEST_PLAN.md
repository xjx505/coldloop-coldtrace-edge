# ColdLoop test plan

## Software tests tonight

1. Build hardware firmware.
2. Build Wokwi firmware.
3. Run Node tests for BLE packet decoding and demo logic.
4. Validate Wokwi diagram JSON and scenario YAML.
5. Run Wokwi interactively/CLI if a local Wokwi token is available.
6. Serve the app locally and verify Demo mode in browser.
7. Test Web Bluetooth feature detection and clean fallback.

## Hardware tests tomorrow

Pass/fail gates:
- Serial boot message appears.
- DHT22 reads finite values.
- ENS160 part ID 0x0160 is detected at 0x52 or 0x53.
- MQ-135 ADC changes when exposed to a strong VOC source, but never exceeds safe ADC voltage.
- ColdLoop-01 appears in Android Chrome Bluetooth chooser.
- Phone receives telemetry once per second.
- Disconnect/reconnect works.
- Demo mode works even if hardware fails.

## Scientific boundary

The app reports environmental/VOC-related condition signals and an anomaly index.
It must not claim:
- exact gas identification from MQ-135,
- microbiological food safety,
- validated remaining shelf life,
- validated spoilage probability,
unless later data/model validation supports those statements.
