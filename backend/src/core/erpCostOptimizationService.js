'use strict';

const aiCost=require('./ai/aiCostController');

function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}

function compareBusinessCost({drivers=[],baseline={},proposed={}}={}){
  const rows=[];
  let baselineTotal=0,proposedTotal=0,complete=true;
  for(const driver of drivers){
    const before=finite(baseline[driver]);
    const after=finite(proposed[driver]);
    if(before==null||after==null){
      complete=false;
      rows.push({driver,baseline:before,proposed:after,status:'MISSING_VALUE'});
      continue;
    }
    baselineTotal+=before;
    proposedTotal+=after;
    rows.push({driver,baseline:before,proposed:after,savings:before-after,status:'DECLARED'});
  }
  const savings=baselineTotal-proposedTotal;
  return {
    complete,
    baselineTotal:complete?baselineTotal:null,
    proposedTotal:complete?proposedTotal:null,
    savings:complete?savings:null,
    savingsPct:complete&&baselineTotal!==0?Math.round((savings/baselineTotal)*10000)/100:null,
    drivers:rows,
    truthRule:'Only explicitly supplied numeric cost drivers are aggregated; missing cost is not assumed zero.',
  };
}

function compareRuntimeOptions(options=[],policy={}){
  const minQuality=finite(policy.minQuality)??0;
  const maxLatencyMs=finite(policy.maxLatencyMs);
  const allowedDataClasses=new Set(policy.allowedDataClasses||[]);
  const evaluated=options.map((option)=>{
    const cost=finite(option.costUsd);
    const quality=finite(option.qualityScore);
    const latency=finite(option.latencyMs);
    const dataClass=option.dataClass||'internal';
    const violations=[];
    if(option.securityAllowed===false)violations.push('security_policy');
    if(quality==null||quality<minQuality)violations.push('quality_floor');
    if(maxLatencyMs!=null&&(latency==null||latency>maxLatencyMs))violations.push('latency_sla');
    if(allowedDataClasses.size&&!allowedDataClasses.has(dataClass))violations.push('data_classification');
    if(cost==null)violations.push('unknown_cost');
    return {...option,costUsd:cost,qualityScore:quality,latencyMs:latency,feasible:violations.length===0,violations};
  });
  const feasible=evaluated.filter(x=>x.feasible).sort((a,b)=>a.costUsd-b.costUsd||b.qualityScore-a.qualityScore||a.id.localeCompare(b.id));
  return {
    selected:feasible[0]||null,
    feasible,
    rejected:evaluated.filter(x=>!x.feasible),
    rule:'Cheapest selection occurs only after security, data-classification, quality and SLA gates pass.',
  };
}

function providerQuote(provider,usage={}){
  const quote=aiCost.quoteCost(provider,usage);
  return {
    ...quote,
    eligibleForCostRouting:quote.known===true,
    truthRule:'Provider cost is routable only when current/configured pricing exists; legacy static rates are never billing authority.',
  };
}

function optimize(domainId,{drivers=[],baseline={},proposed={},runtimeOptions=[],runtimePolicy={}}={}){
  return {
    domainId,
    business:compareBusinessCost({drivers,baseline,proposed}),
    runtime:compareRuntimeOptions(runtimeOptions,runtimePolicy),
    generatedAt:new Date().toISOString(),
  };
}

module.exports={compareBusinessCost,compareRuntimeOptions,providerQuote,optimize};
