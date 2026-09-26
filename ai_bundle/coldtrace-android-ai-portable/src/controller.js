import {extractFeatures} from './features.js';
import {score} from './model.js';
export function evaluateWindow(observations,model){
  const needed=model.feature_schema.window_samples;
  const window=observations.slice(-needed);
  if(window.length<needed)return {status:'MODEL WARM-UP',ready_minutes:Math.max(0,(window.length-1)*10),required_minutes:60};
  for(let i=1;i<window.length;i++){
    if(window[i].timestamp_ms-window[i-1].timestamp_ms!==model.source_cadence_minutes*60000)
      return {status:'MODEL WARM-UP',ready_minutes:0,required_minutes:60,reason:'Gap in 10-minute history'};
  }
  try{
    const features=extractFeatures(window,model.sensor_configuration,model.feature_schema);
    const started=performance.now();const riskScore=score(features,model);const latencyMs=performance.now()-started;
    return {status:'READY',features,score:riskScore,high:riskScore>=model.decision_threshold,latency_ms:latencyMs,model_version:model.model_version};
  }catch(error){return {status:'MODEL WARM-UP',ready_minutes:0,required_minutes:60,reason:String(error.message||error)};}
}
