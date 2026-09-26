#include <Arduino.h>
#include <NimBLEDevice.h>
#include <limits.h>
#include "LiveSensors.h"
#include "ReplayTrace.h"

static constexpr char SERVICE_UUID[]="7a4d0001-5fb2-4a4e-9bb9-34afced20001";
static constexpr char TELEMETRY_UUID[]="7a4d0002-5fb2-4a4e-9bb9-34afced20001";
static constexpr uint32_t LIVE_INTERVAL_MS=1000;
static constexpr uint32_t REPLAY_INTERVAL_MS=1000; // 1 second wall time = 10 minutes recorded time.
static constexpr bool START_IN_REPLAY=true;
static NimBLECharacteristic* telemetry=nullptr;
static LiveSensors liveSensors;
class ConnectionCallbacks: public NimBLEServerCallbacks {
  void onDisconnect(NimBLEServer*,NimBLEConnInfo&,int) override {NimBLEDevice::startAdvertising();}
};
static ConnectionCallbacks connectionCallbacks;
static uint16_t sequenceNumber=0;
static uint8_t replayIndex=0;
static uint32_t lastEmit=0;
static bool replayMode=START_IN_REPLAY;

static void put16(uint8_t* p,uint16_t value){p[0]=value&0xff;p[1]=(value>>8)&0xff;}
static void put32(uint8_t* p,uint32_t value){for(int i=0;i<4;i++)p[i]=(value>>(i*8))&0xff;}
static void emit(uint8_t sensorId,int16_t tempX100,bool error,bool observedR2,uint32_t virtualOrUptimeMs){
  uint8_t bytes[15]{};
  bytes[0]=1; // protocol version
  bytes[1]=(replayMode?0x02:0)|(error?0x04:0)|(observedR2?0x08:0);
  put16(bytes+2,++sequenceNumber);
  put32(bytes+4,virtualOrUptimeMs);
  bytes[8]=sensorId;
  put16(bytes+9,(uint16_t)(error?0:tempX100));
  put16(bytes+11,0xffff); // humidity unavailable
  put16(bytes+13,0xffff); // battery unavailable
  telemetry->setValue(bytes,sizeof(bytes));
  telemetry->notify();
}

void setup(){
  Serial.begin(115200);
  liveSensors.begin();
  NimBLEDevice::init("ColdTrace-ESP32");
  auto* server=NimBLEDevice::createServer();
  server->setCallbacks(&connectionCallbacks);
  auto* service=server->createService(SERVICE_UUID);
  telemetry=service->createCharacteristic(TELEMETRY_UUID,NIMBLE_PROPERTY::READ|NIMBLE_PROPERTY::NOTIFY);
  NimBLEDevice::getAdvertising()->addServiceUUID(SERVICE_UUID);
  NimBLEDevice::startAdvertising();
  Serial.println("ColdTrace BLE ready. Serial R=replay, L=live.");
}

void loop(){
  if(Serial.available()){
    const char command=Serial.read();
    if(command=='r'||command=='R'){replayMode=true;replayIndex=0;lastEmit=0;Serial.println("REPLAY mode");}
    if(command=='l'||command=='L'){replayMode=false;lastEmit=0;Serial.println("LIVE mode");}
  }
  const uint32_t now=millis(),interval=replayMode?REPLAY_INTERVAL_MS:LIVE_INTERVAL_MS;
  if(lastEmit&&now-lastEmit<interval){delay(5);return;}
  lastEmit=now;
  if(replayMode){
    if(replayIndex>=REPLAY_STEPS)return;
    const uint32_t virtualMs=(uint32_t)replayIndex*600000UL;
    for(uint8_t j=0;j<3;j++){
      const int16_t value=REPLAY_TEMP_C_X100[replayIndex][j];
      emit(j+1,value,value==INT16_MIN,REPLAY_OBSERVED_R2[replayIndex],virtualMs);
      delay(10);
    }
    replayIndex++;
  }else{
    liveSensors.request();
    const uint8_t count=liveSensors.count();
    if(count==0){emit(2,0,true,false,now);return;}
    for(uint8_t j=0;j<count;j++){
      const int16_t value=liveSensors.temperatureX100(j);
      emit(liveSensors.sensorId(j),value,value==INT16_MIN,false,now);
      delay(10);
    }
  }
}
