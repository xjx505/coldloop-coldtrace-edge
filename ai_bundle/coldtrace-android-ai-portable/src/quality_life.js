const PROBES=['Front_Middle','Middle_Middle','Rear_Middle'];
const MAX_OBSERVATION_GAP_SECONDS=20*60;

function finiteNumber(value){
  return typeof value==='number' && Number.isFinite(value) ? value : null;
}

export function ratePerSecond(tempC,profile){
  const [lo,hi]=profile.prototype_input_range_c;
  if(!Number.isFinite(tempC)||tempC<lo||tempC>hi)throw new Error(`Temperature ${tempC}C outside quality-model range ${lo}..${hi}C`);
  const kelvin=tempC+273.15;
  return profile.k0_per_second*Math.exp(-profile.activation_energy_j_per_mol/(profile.gas_constant_j_per_mol_k*kelvin));
}

export function referenceShelfLifeDays(profile){
  const k=ratePerSecond(profile.reference_temperature_c,profile);
  const q0=profile.quality_index_initial_percent/100;
  const qEnd=profile.quality_index_end_threshold_percent/100;
  return Math.log(q0/qEnd)/k/86400;
}

export function estimateQualityLife(observations,profile,{startingRemainingDaysRef=null}={}){
  if(!Array.isArray(observations)||observations.length<2)throw new Error('At least two time-ordered observations are required');
  for(let i=1;i<observations.length;i++){
    if(!Number.isFinite(observations[i].timestamp_ms)||observations[i].timestamp_ms<=observations[i-1].timestamp_ms)throw new Error('Quality-life observations must have strictly increasing timestamps');
  }
  const totalSeconds=(observations.at(-1).timestamp_ms-observations[0].timestamp_ms)/1000;
  if(!(totalSeconds>0))throw new Error('Observed duration must be positive');
  const kRef=ratePerSecond(profile.reference_temperature_c,profile);
  const [calLo,calHi]=profile.literature_calibration_range_c;
  const perProbe={};
  for(const probe of PROBES){
    let damage=0,validSeconds=0,extrapolatedSeconds=0,validIntervals=0,missingIntervals=0,longGapIntervals=0;
    for(let i=1;i<observations.length;i++){
      const a=finiteNumber(observations[i-1][probe]),b=finiteNumber(observations[i][probe]);
      const dt=(observations[i].timestamp_ms-observations[i-1].timestamp_ms)/1000;
      if(dt>MAX_OBSERVATION_GAP_SECONDS){missingIntervals++;longGapIntervals++;continue;}
      if(a===null||b===null){missingIntervals++;continue;}
      const mean=(a+b)/2;
      damage+=ratePerSecond(mean,profile)*dt;
      validSeconds+=dt;validIntervals++;
      if(mean<calLo||mean>calHi)extrapolatedSeconds+=dt;
    }
    const coverage=validSeconds/totalSeconds;
    const eq=validSeconds?damage/kRef/86400:null;
    const elapsed=validSeconds/86400;
    const extra=eq===null?null:eq-elapsed;
    perProbe[probe]={
      coverage,
      valid_intervals:validIntervals,
      missing_intervals:missingIntervals,
      long_gap_intervals:longGapIntervals,
      equivalent_quality_age_days_ref:eq,
      additional_quality_age_days_vs_reference:extra===null?null:Math.abs(extra)<1e-12?0:extra,
      extrapolated_fraction:validSeconds?extrapolatedSeconds/validSeconds:0,
    };
  }
  const eligible=Object.entries(perProbe).filter(([,v])=>v.equivalent_quality_age_days_ref!==null&&v.coverage>=0.70).sort((a,b)=>a[1].equivalent_quality_age_days_ref-b[1].equivalent_quality_age_days_ref);
  const temporalGapDetected=Object.values(perProbe).some(v=>v.long_gap_intervals>0)||eligible.some(([,v])=>v.missing_intervals>0);
  let status=eligible.length>=2?'READY':eligible.length===1?'DEGRADED_SPATIAL_COVERAGE':'INSUFFICIENT_COVERAGE';
  if(temporalGapDetected)status='DEGRADED_TEMPORAL_COVERAGE';
  let aggregate=null;
  if(eligible.length){
    const [bestName,best]=eligible[0], [worstName,worst]=eligible.at(-1);
    const values=eligible.map(([,v])=>v.equivalent_quality_age_days_ref);
    aggregate={
      method:'worst_eligible_probe',
      eligible_probe_count:eligible.length,
      minimum_temporal_coverage:Math.min(...eligible.map(([,v])=>v.coverage)),
      temporal_gap_detected:temporalGapDetected,
      best_probe:bestName,
      worst_probe:worstName,
      equivalent_quality_age_days_ref:worst.equivalent_quality_age_days_ref,
      spatial_sensitivity_days_ref:[Math.min(...values),Math.max(...values)],
      additional_quality_age_days_vs_reference:worst.additional_quality_age_days_vs_reference,
      starting_remaining_days_ref:null,
      estimated_remaining_days_ref:null,
      starting_rql_consumed_percent:null,
    };
    if(startingRemainingDaysRef!==null&&startingRemainingDaysRef!==''){
      const start=Number(startingRemainingDaysRef);
      if(!Number.isFinite(start)||start<0)throw new Error('Starting RQL must be non-negative');
      aggregate.starting_remaining_days_ref=start;
      aggregate.estimated_remaining_days_ref=temporalGapDetected||eligible.length<2?null:Math.max(0,start-worst.equivalent_quality_age_days_ref);
      aggregate.starting_rql_consumed_percent=temporalGapDetected||eligible.length<2?null:start>0?Math.min(100,100*worst.equivalent_quality_age_days_ref/start):100;
    }
  }
  return {
    profile_id:profile.profile_id,
    status,
    observed_duration_days:totalSeconds/86400,
    reference_temperature_c:profile.reference_temperature_c,
    reference_shelf_life_days_from_model:referenceShelfLifeDays(profile),
    absolute_rql_available:Boolean(aggregate&&aggregate.estimated_remaining_days_ref!==null),
    per_probe:perProbe,
    aggregate,
    calibration_range_c:profile.literature_calibration_range_c,
    outside_literature_calibration_range_observed:Object.values(perProbe).some(v=>v.extrapolated_fraction>0),
  };
}

export function applyPlatt(rawScore,calibrator){
  const p=Math.min(1-1e-6,Math.max(1e-6,Number(rawScore)));
  const logit=Math.log(p/(1-p));
  return 1/(1+Math.exp(-(calibrator.a*logit+calibrator.b)));
}
