export function score(features,model){
  let linear=model.intercept;
  const missing=new Set(model.missing_indicator_features);
  for(let i=0;i<model.feature_names.length;i++){
    const name=model.feature_names[i],v=features[name];
    const absent=v===null||v===undefined||!Number.isFinite(Number(v));
    const value=absent?model.imputer_medians[name]:Number(v);
    linear+=((value-model.scaler_mean[i])/model.scaler_scale[i])*model.coefficients[i];
  }
  for(let j=0;j<model.missing_indicator_features.length;j++){
    const name=model.missing_indicator_features[j],i=model.feature_names.length+j;
    const v=features[name],indicator=v===null||v===undefined||!Number.isFinite(Number(v))?1:0;
    linear+=((indicator-model.scaler_mean[i])/model.scaler_scale[i])*model.coefficients[i];
  }
  return linear>=0?1/(1+Math.exp(-linear)):Math.exp(linear)/(1+Math.exp(linear));
}
export function explain(features,model,limit=5){
  const rows=[];
  for(let i=0;i<model.feature_names.length;i++){
    const name=model.feature_names[i],raw=features[name],missing=raw===null||raw===undefined||!Number.isFinite(Number(raw));
    const value=missing?model.imputer_medians[name]:Number(raw);
    const contribution=((value-model.scaler_mean[i])/model.scaler_scale[i])*model.coefficients[i];
    rows.push({feature:name,contribution,direction:contribution>=0?'risk_up':'risk_down'});
  }
  for(let j=0;j<model.missing_indicator_features.length;j++){
    const name=model.missing_indicator_features[j],i=model.feature_names.length+j,raw=features[name];
    const indicator=raw===null||raw===undefined||!Number.isFinite(Number(raw))?1:0;
    const contribution=((indicator-model.scaler_mean[i])/model.scaler_scale[i])*model.coefficients[i];
    rows.push({feature:`${name} missing`,contribution,direction:contribution>=0?'risk_up':'risk_down'});
  }
  return rows.sort((a,b)=>Math.abs(b.contribution)-Math.abs(a.contribution)).slice(0,limit);
}
