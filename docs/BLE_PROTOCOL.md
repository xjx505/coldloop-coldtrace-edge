# ColdLoop BLE protocol

Device name: ColdLoop-01

Service UUID:
6d6f0001-7c62-4f44-a4d2-0c5a9b2bca01

Telemetry characteristic UUID:
6d6f0002-7c62-4f44-a4d2-0c5a9b2bca01

The notify/read payload is exactly 20 bytes, little-endian. The hardware publishes approximately every 2 seconds to respect DHT22 sampling limits:

offset  size  field
0       2     sequence uint16
2       2     temperature x100 int16
4       2     humidity x100 uint16
6       2     MQ-135 raw ADC uint16
8       2     ENS160 TVOC ppb uint16
10      2     ENS160 eCO2 ppm uint16
12      1     ENS160 AQI
13      1     ENS160 raw status
14      1     anomaly score 0..100
15      1     flags bitmask
16      4     uptime milliseconds uint32

Flags:
bit 0 temperature above demo threshold
bit 1 MQ-135 relative rise
bit 2 TVOC above demo threshold
bit 3 DHT22 fault
bit 4 ENS160 fault
bit 5 MQ-135 relative baseline formed from 30 nonzero readings. This means a local comparison baseline exists; it does not mean the sensor has completed physical heater warm-up or chemical calibration.

The binary packet is intentionally 20 bytes so it fits the conservative BLE notification payload without depending on a large negotiated MTU.
