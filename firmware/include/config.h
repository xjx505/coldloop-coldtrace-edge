#pragma once
#include <Arduino.h>

namespace cfg {
constexpr uint8_t DHT_PIN = 4;
constexpr uint8_t MQ135_ADC_PIN = 0;
constexpr uint8_t I2C_SDA_PIN = 6;
constexpr uint8_t I2C_SCL_PIN = 7;

constexpr uint32_t SERIAL_BAUD = 115200;
constexpr uint32_t SAMPLE_INTERVAL_MS = 2000;

constexpr char BLE_DEVICE_NAME[] = "ColdLoop-01";
constexpr char BLE_SERVICE_UUID[] = "6d6f0001-7c62-4f44-a4d2-0c5a9b2bca01";
constexpr char BLE_TELEMETRY_UUID[] = "6d6f0002-7c62-4f44-a4d2-0c5a9b2bca01";

constexpr float DEMO_TARGET_MAX_TEMP_C = 8.0f;
constexpr float MQ_RELATIVE_ALERT = 1.45f;
constexpr uint16_t TVOC_ALERT_PPB = 700;
}

enum TelemetryFlags : uint8_t {
  FLAG_TEMP_HIGH = 1 << 0,
  FLAG_MQ_RISE   = 1 << 1,
  FLAG_TVOC_HIGH = 1 << 2,
  FLAG_DHT_FAULT = 1 << 3,
  FLAG_ENS_FAULT = 1 << 4,
  FLAG_MQ_BASELINE_READY = 1 << 5,
};

#pragma pack(push, 1)
struct TelemetryPacket {
  uint16_t seq;
  int16_t temp_x100;
  uint16_t humidity_x100;
  uint16_t mq_raw;
  uint16_t tvoc_ppb;
  uint16_t eco2_ppm;
  uint8_t aqi;
  uint8_t ens_status;
  uint8_t anomaly_score;
  uint8_t flags;
  uint32_t uptime_ms;
};
#pragma pack(pop)

static_assert(sizeof(TelemetryPacket) == 20, "BLE packet must remain exactly 20 bytes");
