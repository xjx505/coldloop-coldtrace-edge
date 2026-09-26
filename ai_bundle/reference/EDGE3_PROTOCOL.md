# ColdTrace BLE telemetry v1

ESP32-C3 NimBLE GATT server: service `7a4d0001-5fb2-4a4e-9bb9-34afced20001`; read/notify characteristic `7a4d0002-5fb2-4a4e-9bb9-34afced20001`. The phone uses Web Bluetooth on Android Chrome in a secure context.

The 15-byte notification is little-endian:

| Offset | Type | Field | Meaning |
|---:|---|---|---|
| 0 | uint8 | version | `1` |
| 1 | uint8 | flags | bit 0 door open, bit 1 replay, bit 2 sensor error, bit 3 recorded R2 marker, bit 4 door state available (when set, bit 0 says OPEN/CLOSED) |
| 2 | uint16 | sequence | wraps at 65535 |
| 4 | uint32 | uptime/time offset ms | live: device uptime; replay: virtual time since first stored sample (10 minutes per step) |
| 8 | uint8 | sensor ID | 1 front-middle, 2 middle-middle, 3 rear-middle |
| 9 | int16 | temperature ×100 | °C, ignored when error flag is set |
| 11 | uint16 | humidity ×100 | `%`, `65535` means unavailable |
| 13 | uint16 | battery mV | `65535` means unavailable |

Replay bit 3 is benchmark outcome metadata and **never enters model features**. Replay data is a real recorded S2 trace; timestamps are virtualized on receipt and the phone displays ACCELERATED REPLAY. Live packets are timestamped by the phone on receipt. There is no claim of exact wall-clock synchronization from the MCU.

The phone rejects non-finite/non-numeric temperatures and marks readings outside the DS18B20 operating range (`-55°C` to `+125°C`) as `SENSOR_ERROR`, excluding them from the bucket mean. A valid `100°C` reading remains a valid sensor value and produces a HIGH thermal-risk score in the demo model; the prototype has no separate in-range jump or out-of-distribution sensor-fault detector. [DS18B20 datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/DS18B20.pdf).

The firmware starts in replay mode for a judge demo. Serial `L` switches to physical DS18B20 sensing; `R` restarts replay. A single connected DS18B20 advertises sensor ID 2 (EDGE-1 compatible). Three connected devices advertise IDs 1–3 in enumeration order; bind probe ROM IDs to physical positions before field deployment. The MCU does not run ML.
