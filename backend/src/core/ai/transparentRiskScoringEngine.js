'use strict';

function clamp01(v){return Math.max(0,Math.min(1,Number(v)));}
function score({criteria=[],missingPolicy='reject'}={}){
  if(!Array.isArray(criteria)||!criteria.length){
    return {status:'invalid_input',available:false,reason:'criteria[] is required'};
  }
  let weighted=0,totalWeight=0;
  const factors=[];
  for(const c of criteria){
    const weight=Number(c.weight);
    const raw=Number(c.value);
    if(!Number.isFinite(weight)||weight<=0)throw new Error('each risk criterion requires positive weight');
    if(!Number.isFinite(raw)){
      if(missingPolicy==='reject')return {status:'insufficient_data',available:false,reason:'missing criterion value',criterion:c.id||c.name};
      continue;
    }
    const normalized=clamp01(c.higherIsRisk===false?1-raw:raw);
    weighted+=normalized*weight;
    totalWeight+=weight;
    factors.push({id:c.id||c.name||'criterion',rawValue:raw,normalizedRisk:normalized,weight,contribution:normalized*weight});
  }
  if(!totalWeight)return {status:'insufficient_data',available:false,reason:'no usable criteria'};
  const riskScore=weighted/totalWeight;
  const level=riskScore>=0.8?'critical':riskScore>=0.6?'high':riskScore>=0.35?'medium':'low';
  return {
    status:'evaluated',available:true,riskScore:Math.round(riskScore*1000)/1000,riskLevel:level,
    factors,totalWeight,
    method:'transparent weighted normalized criteria',
    predictive:false,
    limitations:['score quality depends on criterion definitions and input quality','not a trained probability model'],
  };
}
module.exports={score,clamp01};
