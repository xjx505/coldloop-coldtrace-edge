# Simulation strategy

The simulator validates the firmware and application pipeline, not food chemistry.

- DHT22 is simulated directly by Wokwi.
- Wokwi's MQ2 gas module is used only as an adjustable analog stand-in for the MQ-135 AOUT signal.
- ENS160 outputs are generated deterministically in the firmware's COLDLOOP_SIM mode.
- Hardware firmware uses the actual ENS160 I2C register interface and probes addresses 0x53 then 0x52.

Run/build from ../firmware using the `wokwi` PlatformIO environment.
