// Same seven-observation feature equations as edge/feature_engine.py.
const clean = x => typeof x !== 'number' || !Number.isFinite(x) || x < -55 || x > 125 ? null : x;
const std = values => { const mean=values.reduce((a,b)=>a+b,0)/values.length; return Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/values.length); };
export function extractFeatures(window,config,schema){
  if(window.length!==schema.window_samples) throw new Error('60 minutes require seven 10-minute observations');
  const sensors=schema.sensor_configurations[config];if(!sensors)throw new Error('Unknown sensor configuration');
  const center=window.map(r=>{const active=sensors.map(sensor=>clean(r[sensor])).filter(x=>x!==null);return active.length?active.reduce((a,b)=>a+b,0)/active.length:null;});const valid=center.filter(x=>x!==null);
  if(center.at(-1)===null||valid.length<4)throw new Error('Insufficient sensor history');
  const now=center.at(-1),first=center[0];
  const slope=lag=>center.at(-1-lag)===null?null:(now-center.at(-1-lag))*60/(lag*10);
  let streak=0,maxStreak=0;for(const x of center){streak=x===null?streak+1:0;maxStreak=Math.max(maxStreak,streak);}
  const s10=slope(1),s20=slope(2);
  const result={temp_now:now,mean_60:valid.reduce((a,b)=>a+b,0)/valid.length,std_60:std(valid),min_60:Math.min(...valid),max_60:Math.max(...valid),range_60:Math.max(...valid)-Math.min(...valid),delta_60:first===null?null:now-first,slope_10:s10,slope_20:s20,slope_60:slope(6),acceleration:s10===null||s20===null?null:s10-s20,over_4_count:valid.filter(x=>x>schema.high_reference_c).length,over_4_auc:valid.reduce((a,x)=>a+Math.max(0,x-schema.high_reference_c),0)/6,under_0_count:valid.filter(x=>x<schema.low_reference_c).length,coverage:valid.length/7,max_missing_streak:maxStreak};
  if(config==='EDGE-3'){
    const spatialCounts=window.map(row=>sensors.filter(sensor=>clean(row[sensor])!==null).length);
    if(spatialCounts.at(-1)<2||spatialCounts.filter(count=>count>=2).length<4)throw new Error('EDGE-3 requires at least two observed probe positions');
    const spreads=[];let present=0;
    for(const row of window){const xs=sensors.map(s=>clean(row[s])).filter(x=>x!==null);present+=xs.length;if(xs.length>=2)spreads.push(Math.max(...xs)-Math.min(...xs));}
    const current=sensors.map(s=>clean(window.at(-1)[s]));const active=current.filter(x=>x!==null);
    Object.assign(result,{spatial_range_now:active.length>=2?Math.max(...active)-Math.min(...active):null,spatial_std_now:active.length>=2?std(active):null,spatial_range_mean_60:spreads.length?spreads.reduce((a,b)=>a+b,0)/spreads.length:null,spatial_range_max_60:spreads.length?Math.max(...spreads):null,front_rear_gradient:current[0]===null||current[2]===null?null:current[2]-current[0],spatial_coverage:present/21});
  }
  const names=config==='EDGE-1'?schema.features['EDGE-1']:[...schema.features['EDGE-1'],...schema.features['EDGE-3_EXTRA']];
  return Object.fromEntries(names.map(name=>[name,result[name]]));
}
