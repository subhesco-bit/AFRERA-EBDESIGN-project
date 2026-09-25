/**
 * AI cost governance.
 *
 * Provider pricing changes frequently. Runtime billing decisions MUST use a
 * configured/observed pricing definition, never the legacy constants below.
 * Legacy rates are preserved only so old reports remain interpretable.
 */
'use strict';

const { logger } = require('../../utils/logger');

const LEGACY_COST_RATES = Object.freeze({
  claude:0.003,
  openai:0.002,
  gemini:0.001,
  deepseek:0.001,
});
const COST_RATES = LEGACY_COST_RATES;

const costState={
  hourlyBudget:10,
  dailyBudget:100,
  hourlySpend:0,
  dailySpend:0,
  tokenCount:0,
  requestCount:0,
  unknownCostRequests:0,
  lastHourlyReset:Date.now(),
  lastDailyReset:Date.now(),
};

const pricingCatalog=new Map();
pricingCatalog.set('local',{inputPer1k:0,outputPer1k:0,request:0,currency:'USD',authority:'local_no_external_bill',verifiedAt:null});

function loadPricingFromEnv(){
  const raw=process.env.AI_PROVIDER_PRICING_JSON;
  if(!raw)return;
  try{
    const parsed=JSON.parse(raw);
    for(const [provider,entry] of Object.entries(parsed||{}))configurePricing(provider,entry,'env:AI_PROVIDER_PRICING_JSON');
  }catch(error){
    logger.warn('AI provider pricing JSON is invalid; external cost remains unknown',{error:error.message});
  }
}
function configurePricing(provider,entry={},authority='runtime_config'){
  if(!provider)throw new Error('provider is required');
  const normalized={
    inputPer1k:Number.isFinite(Number(entry.inputPer1k))?Number(entry.inputPer1k):null,
    outputPer1k:Number.isFinite(Number(entry.outputPer1k))?Number(entry.outputPer1k):null,
    request:Number.isFinite(Number(entry.request))?Number(entry.request):0,
    currency:String(entry.currency||'USD').toUpperCase(),
    authority,
    verifiedAt:entry.verifiedAt||new Date().toISOString(),
    model:entry.model||null,
  };
  if(normalized.inputPer1k==null&&normalized.outputPer1k==null&&normalized.request===0){
    throw new Error('pricing entry must contain inputPer1k, outputPer1k, or request');
  }
  pricingCatalog.set(String(provider),normalized);
  return {...normalized};
}
function getPricing(provider){
  if(!pricingCatalog.size||!pricingCatalog.has(String(provider)))loadPricingFromEnv();
  const p=pricingCatalog.get(String(provider));
  return p?{...p}:null;
}
function checkResetWindow(now=Date.now()){
  if(now-costState.lastHourlyReset>=3600000){
    costState.hourlySpend=0;
    costState.lastHourlyReset=now;
  }
  if(now-costState.lastDailyReset>=86400000){
    costState.dailySpend=0;
    costState.lastDailyReset=now;
  }
}
function checkBudgetConstraints(additionalCost=0){
  checkResetWindow();
  const known=Number.isFinite(Number(additionalCost));
  const nextHourly=costState.hourlySpend+(known?Number(additionalCost):0);
  const nextDaily=costState.dailySpend+(known?Number(additionalCost):0);
  const hourlyUtilization=nextHourly/costState.hourlyBudget;
  const dailyUtilization=nextDaily/costState.dailyBudget;
  let warning=null,withinBudget=true,reason=null;
  if(hourlyUtilization>=1){withinBudget=false;reason='Hourly budget would be exceeded';}
  else if(hourlyUtilization>=0.9)warning='Hourly budget at or above 90%';
  if(dailyUtilization>=1){withinBudget=false;reason='Daily budget would be exceeded';}
  else if(dailyUtilization>=0.9)warning='Daily budget at or above 90%';
  return {withinBudget,warning,reason,costKnown:known,hourlyUtilization,dailyUtilization};
}
function quoteCost(provider,{inputTokens=0,outputTokens=0,requests=1}={}){
  const pricing=getPricing(provider);
  if(!pricing)return {known:false,costUsd:null,provider,reason:'provider_pricing_not_configured'};
  if(pricing.currency!=='USD')return {known:false,costUsd:null,provider,reason:'non_usd_pricing_requires_explicit_fx_conversion',pricing};
  const inputRate=pricing.inputPer1k??pricing.outputPer1k;
  const outputRate=pricing.outputPer1k??pricing.inputPer1k;
  if(inputRate==null&&outputRate==null&&pricing.request===0)return {known:false,costUsd:null,provider,reason:'pricing_incomplete',pricing};
  const cost=((Number(inputTokens)||0)/1000)*(inputRate||0)+((Number(outputTokens)||0)/1000)*(outputRate||0)+(Number(requests)||0)*(pricing.request||0);
  return {known:true,costUsd:cost,provider,pricing};
}
function estimateCost(provider,estimatedTokens,metadata={}){
  const quote=quoteCost(provider,{inputTokens:Number(metadata.inputTokens??estimatedTokens??0),outputTokens:Number(metadata.outputTokens??0),requests:metadata.requests??1});
  return quote.known?quote.costUsd:null;
}
function recordCost(provider,tokens,metadata={}){
  checkResetWindow();
  const inputTokens=Number(metadata.inputTokens??tokens??0);
  const outputTokens=Number(metadata.outputTokens??0);
  const explicit=Number(metadata.costUsd);
  const quote=Number.isFinite(explicit)
    ? {known:true,costUsd:explicit,provider,pricing:{authority:metadata.costAuthority||'observed_runtime_cost'}}
    : quoteCost(provider,{inputTokens,outputTokens,requests:metadata.requests??1});
  costState.tokenCount+=Math.max(0,inputTokens)+Math.max(0,outputTokens);
  costState.requestCount+=1;
  if(quote.known){
    costState.hourlySpend+=quote.costUsd;
    costState.dailySpend+=quote.costUsd;
  }else costState.unknownCostRequests+=1;
  const budget=checkBudgetConstraints();
  return {
    cost:quote.costUsd,tokens:inputTokens+outputTokens,provider,costKnown:quote.known,
    pricingAuthority:quote.pricing?.authority||null,withinBudget:budget.withinBudget,budgetWarning:budget.warning,
    ...metadata,
  };
}
function getCostState(){
  checkResetWindow();
  return {
    ...costState,
    hourlyUtilization:costState.hourlySpend/costState.hourlyBudget,
    dailyUtilization:costState.dailySpend/costState.dailyBudget,
    averageKnownCostPerRequest:costState.requestCount>costState.unknownCostRequests
      ? costState.dailySpend/(costState.requestCount-costState.unknownCostRequests):null,
    pricingConfiguredProviders:[...pricingCatalog.keys()],
    legacyRatesAuthority:'legacy-static-unverified-not-billing-authority',
  };
}
function setBudgets(hourly,daily){
  if(Number.isFinite(Number(hourly))&&Number(hourly)>0)costState.hourlyBudget=Number(hourly);
  if(Number.isFinite(Number(daily))&&Number(daily)>0)costState.dailyBudget=Number(daily);
  logger.info('AI budget limits updated',{hourly:costState.hourlyBudget,daily:costState.dailyBudget});
}
function getCostRate(provider){
  const pricing=getPricing(provider);
  return pricing?.inputPer1k??pricing?.outputPer1k??null;
}
function findCheapestProvider(providers=[]){
  const known=(providers||[]).map((provider)=>({provider,rate:getCostRate(provider)})).filter((x)=>Number.isFinite(x.rate));
  known.sort((a,b)=>a.rate-b.rate);
  return known[0]?.provider||null;
}
function pricingStatus(){
  return {
    configured:[...pricingCatalog.entries()].map(([provider,pricing])=>({provider,...pricing})),
    legacy:Object.entries(LEGACY_COST_RATES).map(([provider,rate])=>({provider,rate,authority:'legacy-static-unverified'})),
  };
}

loadPricingFromEnv();

module.exports={
  recordCost,getCostState,setBudgets,getCostRate,estimateCost,findCheapestProvider,
  configurePricing,getPricing,quoteCost,pricingStatus,checkBudgetConstraints,
  COST_RATES,LEGACY_COST_RATES,
};
