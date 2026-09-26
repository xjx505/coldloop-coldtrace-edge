export const SERVICE_UUID='7a4d0001-5fb2-4a4e-9bb9-34afced20001';
export const TELEMETRY_UUID='7a4d0002-5fb2-4a4e-9bb9-34afced20001';
export const SENSOR_NAMES={1:'Front_Middle',2:'Middle_Middle',3:'Rear_Middle'};
export const DS18B20_MIN_C=-55;
export const DS18B20_MAX_C=125;
export const NORMALIZED_PACKET_FIELDS=['protocol_version','node_id','sequence','uptime_ms','timestamp_ms','sensor_id','sensor_name','temperature_c','humidity_pct','door_open','battery_mv','mode','sensor_error','recorded_r2','virtual_scenario','source_kind'];
export function createMonotonicEpochClock(epochOriginMs=Date.now(),monotonicOriginMs=performance.now(),monotonicNow=()=>performance.now()){
  return ()=>Math.floor(epochOriginMs+monotonicNow()-monotonicOriginMs);
}
export function classifyPacketOrder(packet,lastSequence,lastTimestampMs){
  if(!Number.isInteger(packet.sequence)||packet.sequence<0||packet.sequence>0xffff||!Number.isSafeInteger(packet.timestamp_ms))
    return {accepted:false,dropped:1,reason:'invalid sequence or timestamp'};
  let missing=0;
  if(lastSequence!==null){
    const expected=(lastSequence+1)&0xffff;
    if(packet.sequence!==expected){
      const gap=(packet.sequence-expected+0x10000)&0xffff;
      if(gap>=0x8000)return {accepted:false,dropped:1,reason:'duplicate or reordered sequence'};
      missing=gap;
    }
  }
  if(packet.timestamp_ms<lastTimestampMs)return {accepted:false,dropped:missing+1,reason:'backwards timestamp'};
  return {accepted:true,dropped:missing,reason:null};
}
export function decodePacket(view,timestampMs=Date.now(),nodeId='BLE-NODE'){
  if(view.byteLength!==15)throw new Error(`Expected 15-byte packet, got ${view.byteLength}`);
  const version=view.getUint8(0),flags=view.getUint8(1);if(version!==1)throw new Error(`Unsupported BLE protocol version ${version}`);
  const sensorId=view.getUint8(8);if(!SENSOR_NAMES[sensorId])throw new Error(`Unknown sensor ID ${sensorId}`);
  const humidity=view.getUint16(11,true),battery=view.getUint16(13,true);
  const temperature=view.getInt16(9,true)/100;
  const sensorError=Boolean(flags&4)||temperature<DS18B20_MIN_C||temperature>DS18B20_MAX_C;
  return {protocol_version:version,node_id:nodeId,sequence:view.getUint16(2,true),uptime_ms:view.getUint32(4,true),timestamp_ms:timestampMs,sensor_id:sensorId,sensor_name:SENSOR_NAMES[sensorId],temperature_c:sensorError?null:temperature,humidity_pct:humidity===65535?null:humidity/100,door_open:flags&0x10?!!(flags&1):null,battery_mv:battery===65535?null:battery,mode:flags&2?'REPLAY':'LIVE',sensor_error:sensorError,recorded_r2:!!(flags&8),virtual_scenario:null,source_kind:'BLE'};
}
export class TelemetrySource{async start(_onPacket,_onStep,_onEnd){throw new Error('Not implemented');}stop(){}}
export class BLETelemetrySource extends TelemetrySource{
  constructor(){super();this.device=null;this.characteristic=null;this.listener=null;this.replayBase=null;this.lastUptime=null;this.lastReceiptMs=null;this.disconnectListener=null;this.epochNow=null;}
  async start(onPacket,onDisconnect=()=>{}){
    if(!navigator.bluetooth)throw new Error('Web Bluetooth unavailable.');
    this.device=await navigator.bluetooth.requestDevice({filters:[{services:[SERVICE_UUID]}]});
    this.disconnectListener=()=>onDisconnect(this.device?.name||this.device?.id);this.device.addEventListener('gattserverdisconnected',this.disconnectListener);
    const server=await this.device.gatt.connect(),service=await server.getPrimaryService(SERVICE_UUID);
    this.characteristic=await service.getCharacteristic(TELEMETRY_UUID);
    this.epochNow=createMonotonicEpochClock();
    this.listener=e=>{const packet=decodePacket(e.target.value,this.epochNow(),this.device.name||this.device.id);if(packet.mode==='REPLAY'){if(this.replayBase===null)this.replayBase=Math.floor(this.epochNow()/600000)*600000-packet.uptime_ms;packet.timestamp_ms=this.replayBase+packet.uptime_ms;}else if(packet.uptime_ms===this.lastUptime)packet.timestamp_ms=this.lastReceiptMs;else{this.lastUptime=packet.uptime_ms;this.lastReceiptMs=packet.timestamp_ms;}onPacket(packet);};
    this.characteristic.addEventListener('characteristicvaluechanged',this.listener);await this.characteristic.startNotifications();
    return this.device.name||this.device.id;
  }
  stop(){if(this.characteristic&&this.listener)this.characteristic.removeEventListener('characteristicvaluechanged',this.listener);if(this.device&&this.disconnectListener)this.device.removeEventListener('gattserverdisconnected',this.disconnectListener);this.device?.gatt?.disconnect();}
}
export class SimulatedTelemetrySource extends TelemetrySource{
  constructor(trace,intervalMs=1000,options={}){super();this.trace=trace;this.intervalMs=intervalMs;this.nodeId=options.nodeId||'CT-REPLAY-S2';this.scenario=options.scenario||'RISK REPLAY';this.timer=null;this.index=0;this.sequence=0;this.onEnd=null;this.paused=false;}
  async start(onPacket,onStep,onEnd){
    this.stop('restarted');this.index=0;this.sequence=0;this.onEnd=onEnd;this.paused=false;
    const tick=()=>{
      if(this.paused)return;
      if(this.index>=this.trace.steps.length){this.stop('complete');return;}
      const index=this.index++,step=this.trace.steps[index],ts=Date.parse(step.timestamp_iso);
      for(const [id,name] of Object.entries(SENSOR_NAMES)){
        let temp=step.sensors[name];let sensorError=temp===null||temp===undefined;
        if(this.scenario==='SPATIAL IMBALANCE'&&id==='3'&&index>=7&&temp!==null)temp+=3.0;
        if(this.scenario==='SENSOR FAILURE'&&id==='3'){temp=null;sensorError=true;}
        onPacket({protocol_version:1,node_id:this.nodeId,sequence:++this.sequence,uptime_ms:index*600000,timestamp_ms:ts,sensor_id:Number(id),sensor_name:name,temperature_c:temp??0,humidity_pct:null,door_open:null,battery_mv:null,mode:'REPLAY',sensor_error:sensorError,recorded_r2:!!step.observed_R2,virtual_scenario:this.scenario,source_kind:'VIRTUAL'});
      }
      onStep?.({...step,index,scenario:this.scenario});
    };
    this.timer=setInterval(tick,this.intervalMs);tick();return this.nodeId;
  }
  stop(reason='stopped'){if(this.timer){clearInterval(this.timer);this.timer=null;}if(this.onEnd){const done=this.onEnd;this.onEnd=null;done(reason);}}
}
export class VirtualHardwareTelemetrySource extends SimulatedTelemetrySource{
  constructor(trace,intervalMs=1000,scenario='RISK REPLAY'){super(trace,intervalMs,{nodeId:'CT-VIRTUAL-ESP32',scenario});}
}
export class TenMinuteAggregator{
  constructor(){this.current=null;}
  ingest(packet){
    if(!Number.isSafeInteger(packet.timestamp_ms))return null;
    const bucket=Math.floor(packet.timestamp_ms/600000)*600000;let closed=null;
    if(this.current&&bucket<this.current.timestamp_ms)return null;
    if(this.current&&bucket>this.current.timestamp_ms)closed=this.flushCurrent();
    if(!this.current)this.current={timestamp_ms:bucket,values:{},humidity:[],door:null,sensor_errors:new Set(),node_id:packet.node_id,mode:packet.mode,scenario:packet.virtual_scenario||null};
    const validTemperature=typeof packet.temperature_c==='number'&&Number.isFinite(packet.temperature_c)&&packet.temperature_c>=DS18B20_MIN_C&&packet.temperature_c<=DS18B20_MAX_C;
    if(packet.sensor_error||!validTemperature)this.current.sensor_errors.add(packet.sensor_id);
    if(!packet.sensor_error&&validTemperature)(this.current.values[packet.sensor_name]??=[]).push(packet.temperature_c);
    if(Number.isFinite(packet.humidity_pct))this.current.humidity.push(packet.humidity_pct);
    if(packet.door_open!==null)this.current.door=packet.door_open;
    return closed;
  }
  flushCurrent(){if(!this.current)return null;const c=this.current;this.current=null;const avg=xs=>xs?.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;return {timestamp_ms:c.timestamp_ms,node_id:c.node_id,mode:c.mode,scenario:c.scenario,sensor_errors:[...c.sensor_errors].sort(),Front_Middle:avg(c.values.Front_Middle),Middle_Middle:avg(c.values.Middle_Middle),Rear_Middle:avg(c.values.Rear_Middle),humidity_pct:avg(c.humidity),door_open:c.door};}
}
