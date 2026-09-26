#include <Arduino.h>
#include <Wire.h>
#include <DHT.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "config.h"

#ifndef COLDLOOP_SIM
#define COLDLOOP_SIM 0
#endif

namespace {
DHT dht(cfg::DHT_PIN, DHT22);
BLECharacteristic* telemetryCharacteristic = nullptr;

uint8_t ensAddress = 0;
bool ensReady = false;
uint16_t sequenceNumber = 0;
float mqBaseline = 0.0f;
uint32_t mqBaselineSamples = 0;

bool i2cRead(uint8_t address, uint8_t reg, uint8_t* dst, size_t len) {
  Wire.beginTransmission(address);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  const size_t got = Wire.requestFrom((int)address, (int)len);
  if (got != len) {
    while (Wire.available()) Wire.read();
    return false;
  }
  for (size_t i = 0; i < len; ++i) dst[i] = Wire.read();
  return true;
}

bool i2cWrite(uint8_t address, uint8_t reg, const uint8_t* src, size_t len) {
  Wire.beginTransmission(address);
  Wire.write(reg);
  for (size_t i = 0; i < len; ++i) Wire.write(src[i]);
  return Wire.endTransmission() == 0;
}

bool ensProbeAddress(uint8_t address) {
  uint8_t id[2] = {0, 0};
  if (!i2cRead(address, 0x00, id, 2)) return false;
  const uint16_t partId = (uint16_t(id[1]) << 8) | id[0];
  return partId == 0x0160;
}

bool ensBegin() {
#if COLDLOOP_SIM
  return true;
#else
  for (const uint8_t candidate : {uint8_t(0x53), uint8_t(0x52)}) {
    if (ensProbeAddress(candidate)) {
      ensAddress = candidate;
      const uint8_t standardMode = 0x02;
      if (!i2cWrite(ensAddress, 0x10, &standardMode, 1)) return false;
      delay(25);
      return true;
    }
  }
  return false;
#endif
}

void ensSetEnvironment(float tempC, float humidity) {
#if !COLDLOOP_SIM
  if (!ensReady || !isfinite(tempC) || !isfinite(humidity)) return;
  const uint16_t t = uint16_t((tempC + 273.15f) * 64.0f);
  const uint16_t rh = uint16_t(constrain(humidity, 0.0f, 100.0f) * 512.0f);
  const uint8_t buf[4] = {
    uint8_t(t & 0xff), uint8_t((t >> 8) & 0xff),
    uint8_t(rh & 0xff), uint8_t((rh >> 8) & 0xff)
  };
  i2cWrite(ensAddress, 0x13, buf, 4);
#endif
}

bool ensRead(uint8_t& status, uint8_t& aqi, uint16_t& tvoc, uint16_t& eco2) {
#if COLDLOOP_SIM
  const uint32_t phase = (millis() / 1000UL) % 60UL;
  if (phase < 15) {
    status = 0; aqi = 1; tvoc = 80; eco2 = 450;
  } else if (phase < 30) {
    status = 0; aqi = 2; tvoc = 180 + (phase - 15) * 15; eco2 = 550 + (phase - 15) * 12;
  } else if (phase < 45) {
    status = 0; aqi = 3; tvoc = 500 + (phase - 30) * 55; eco2 = 850 + (phase - 30) * 35;
  } else {
    status = 0; aqi = 2; tvoc = 350 - (phase - 45) * 15; eco2 = 700 - (phase - 45) * 12;
  }
  return true;
#else
  if (!ensReady) return false;
  uint8_t s = 0, aq = 0, v[2] = {0,0}, c[2] = {0,0};
  if (!i2cRead(ensAddress, 0x20, &s, 1)) return false;
  if (!i2cRead(ensAddress, 0x21, &aq, 1)) return false;
  if (!i2cRead(ensAddress, 0x22, v, 2)) return false;
  if (!i2cRead(ensAddress, 0x24, c, 2)) return false;
  status = s;
  aqi = aq;
  tvoc = (uint16_t(v[1]) << 8) | v[0];
  eco2 = (uint16_t(c[1]) << 8) | c[0];
  return true;
#endif
}

uint16_t readMqRaw() {
#if COLDLOOP_SIM
  // In Wokwi this is driven by a potentiometer on GPIO0.
  return uint16_t(analogRead(cfg::MQ135_ADC_PIN));
#else
  return uint16_t(analogRead(cfg::MQ135_ADC_PIN));
#endif
}

void updateMqBaseline(uint16_t raw) {
  if (raw == 0) return;
  if (mqBaselineSamples < 30) {
    mqBaseline = (mqBaseline * mqBaselineSamples + raw) / float(mqBaselineSamples + 1);
    ++mqBaselineSamples;
  } else {
    // Very slow drift tracking so short VOC events still stand out.
    mqBaseline = mqBaseline * 0.995f + raw * 0.005f;
  }
}

uint8_t calculateAnomaly(float tempC, uint16_t mqRaw, uint16_t tvoc, uint8_t& flags, bool dhtOk, bool ensOk) {
  flags = 0;
  float score = 0.0f;

  if (!dhtOk) flags |= FLAG_DHT_FAULT;
  if (!ensOk) flags |= FLAG_ENS_FAULT;
  if (mqBaselineSamples >= 30) flags |= FLAG_MQ_BASELINE_READY;

  if (dhtOk && tempC > cfg::DEMO_TARGET_MAX_TEMP_C) {
    flags |= FLAG_TEMP_HIGH;
    score += constrain((tempC - cfg::DEMO_TARGET_MAX_TEMP_C) * 8.0f, 0.0f, 35.0f);
  }

  if (mqBaselineSamples >= 10 && mqBaseline > 10.0f) {
    const float ratio = mqRaw / mqBaseline;
    if (ratio >= cfg::MQ_RELATIVE_ALERT) {
      flags |= FLAG_MQ_RISE;
      score += constrain((ratio - 1.0f) * 35.0f, 0.0f, 35.0f);
    }
  }

  if (ensOk && tvoc >= cfg::TVOC_ALERT_PPB) {
    flags |= FLAG_TVOC_HIGH;
    score += constrain((tvoc - cfg::TVOC_ALERT_PPB) / 25.0f, 0.0f, 30.0f);
  }

  if (!dhtOk) score += 10.0f;
  if (!ensOk) score += 10.0f;

  return uint8_t(constrain(score, 0.0f, 100.0f));
}

void printJson(const TelemetryPacket& p) {
  Serial.printf(
    "{\"seq\":%u,\"ms\":%lu,\"temp\":%.2f,\"humidity\":%.2f,\"mq135_raw\":%u,"
    "\"tvoc_ppb\":%u,\"eco2_ppm\":%u,\"aqi\":%u,\"ens_status\":%u,"
    "\"anomaly\":%u,\"flags\":%u,\"sim\":%s}\n",
    p.seq, (unsigned long)p.uptime_ms, p.temp_x100 / 100.0f, p.humidity_x100 / 100.0f,
    p.mq_raw, p.tvoc_ppb, p.eco2_ppm, p.aqi, p.ens_status,
    p.anomaly_score, p.flags, COLDLOOP_SIM ? "true" : "false"
  );
}

void setupBle() {
  BLEDevice::init(cfg::BLE_DEVICE_NAME);
  BLEDevice::setMTU(64);
  BLEServer* server = BLEDevice::createServer();
  BLEService* service = server->createService(cfg::BLE_SERVICE_UUID);
  telemetryCharacteristic = service->createCharacteristic(
    cfg::BLE_TELEMETRY_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  telemetryCharacteristic->addDescriptor(new BLE2902());
  service->start();

  BLEAdvertising* advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(cfg::BLE_SERVICE_UUID);
  advertising->setScanResponse(true);
  BLEDevice::startAdvertising();
}

void publishBle(const TelemetryPacket& p) {
  if (!telemetryCharacteristic) return;
  uint8_t payload[sizeof(TelemetryPacket)];
  memcpy(payload, &p, sizeof(TelemetryPacket));
  telemetryCharacteristic->setValue(payload, sizeof(payload));
  telemetryCharacteristic->notify();
}
}

void setup() {
  Serial.begin(cfg::SERIAL_BAUD);
  delay(250);
  Serial.println("\nColdLoop booting...");

  pinMode(cfg::MQ135_ADC_PIN, INPUT);
  analogReadResolution(12);
#ifdef ADC_11db
  analogSetPinAttenuation(cfg::MQ135_ADC_PIN, ADC_11db);
#endif

  dht.begin();
  Wire.begin(cfg::I2C_SDA_PIN, cfg::I2C_SCL_PIN);
  Wire.setClock(100000);

  ensReady = ensBegin();
  Serial.printf("ENS160: %s%s\n", ensReady ? "ready" : "not detected", COLDLOOP_SIM ? " (simulated)" : "");
  if (!COLDLOOP_SIM && ensReady) Serial.printf("ENS160 address: 0x%02X\n", ensAddress);

  setupBle();
  Serial.println("BLE advertising as ColdLoop-01");
  Serial.printf("Telemetry packet bytes: %u\n", unsigned(sizeof(TelemetryPacket)));
}

void loop() {
  static uint32_t lastSample = 0;
  const uint32_t now = millis();
  if (now - lastSample < cfg::SAMPLE_INTERVAL_MS) {
    delay(5);
    return;
  }
  lastSample = now;

  float tempC = dht.readTemperature();
  float humidity = dht.readHumidity();
  bool dhtOk = isfinite(tempC) && isfinite(humidity);

#if COLDLOOP_SIM
  // Wokwi DHT22 values are used if available. If not, keep the simulation deterministic.
  if (!dhtOk) {
    const float phase = float((now / 1000UL) % 60UL);
    tempC = phase < 20 ? 4.5f : (phase < 35 ? 4.5f + (phase - 20) * 0.4f : 7.0f);
    humidity = phase < 30 ? 82.0f : 74.0f;
    dhtOk = true;
  }
#endif

  ensSetEnvironment(tempC, humidity);

  uint8_t ensStatus = 0xff, aqi = 0;
  uint16_t tvoc = 0, eco2 = 0;
  bool ensOk = ensRead(ensStatus, aqi, tvoc, eco2);

  const uint16_t mqRaw = readMqRaw();
  updateMqBaseline(mqRaw);

  uint8_t flags = 0;
  const uint8_t anomaly = calculateAnomaly(tempC, mqRaw, tvoc, flags, dhtOk, ensOk);

  TelemetryPacket packet{};
  packet.seq = sequenceNumber++;
  packet.temp_x100 = int16_t(constrain(tempC * 100.0f, -32768.0f, 32767.0f));
  packet.humidity_x100 = uint16_t(constrain(humidity * 100.0f, 0.0f, 10000.0f));
  packet.mq_raw = mqRaw;
  packet.tvoc_ppb = tvoc;
  packet.eco2_ppm = eco2;
  packet.aqi = aqi;
  packet.ens_status = ensStatus;
  packet.anomaly_score = anomaly;
  packet.flags = flags;
  packet.uptime_ms = now;

  printJson(packet);
  publishBle(packet);
}
