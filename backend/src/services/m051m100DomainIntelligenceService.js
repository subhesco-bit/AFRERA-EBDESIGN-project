const { getPostgreSQL } = require('../database');

class M051M100DomainIntelligenceService {
 constructor(){this.db=getPostgreSQL();}

 fpoProcurementDecision({quantity,unitPrice,marketPrice,transportCost=0,qualityPenalty=0}){
  const q=Number(quantity), price=Number(unitPrice), market=Number(marketPrice);
  if(!(q>0&&price>=0&&market>=0)) throw new Error('Invalid procurement economics');
  const landed=price+Number(transportCost||0)+Number(qualityPenalty||0);
  const margin=market-landed;
  return {quantity:q,landedUnitCost:landed,expectedUnitMargin:margin,expectedGrossMargin:q*margin,decision:margin>0?'BUY':'REVIEW',priceRisk:market>0?Math.max(0,1-margin/market):1};
 }

 membershipHealth({activeMembers,previousActiveMembers,overdueMembers=0}){
  const current=Number(activeMembers), previous=Number(previousActiveMembers);
  const retention=previous>0?current/previous:1;
  return {retention:Number(retention.toFixed(4)),overdueMemberRatio:current>0?Number((Number(overdueMembers)/current).toFixed(4)):0,health:retention>=0.9?'healthy':retention>=0.75?'watch':'at_risk'};
 }

 cropPlan({area,expectedYield,expectedPrice,inputCost,labourCost,waterCost=0}){
  const a=Number(area), y=Number(expectedYield), p=Number(expectedPrice), cost=Number(inputCost)+Number(labourCost)+Number(waterCost);
  if(!(a>0&&y>=0&&p>=0&&cost>=0)) throw new Error('Invalid crop economics');
  const output=a*y, revenue=output*p, profit=revenue-a*cost;
  return {output,revenue,totalCost:a*cost,profit,profitPerArea:profit/a,breakEvenPrice:output>0?(a*cost/output):null};
 }

 seedRequirement({area,seedRate,availableSeed}){
  const required=Number(area)*Number(seedRate), available=Number(availableSeed||0);
  return {requiredSeed:required,availableSeed:available,shortfall:Math.max(0,required-available),surplus:Math.max(0,available-required),procurementRequired:required>available};
 }

 harvestReadiness({cropStage,targetStage,daysToTarget,weatherRisk=0,pestRisk=0}){
  const stageReady=String(cropStage).toLowerCase()===String(targetStage).toLowerCase();
  const risk=(Number(weatherRisk)+Number(pestRisk))/2;
  return {stageReady,combinedRisk:risk,harvestRecommendation:stageReady&&risk<0.4?'READY':risk>=0.7?'DEFER_AND_PROTECT':'MONITOR'};
 }

 soilAmendment({ph,organicCarbon,targetPh=6.5}){
  const p=Number(ph), oc=Number(organicCarbon); if(!(p>=0&&p<=14&&oc>=0)) throw new Error('Invalid soil measurements');
  const phGap=Number((Number(targetPh)-p).toFixed(2));
  return {phGap,organicCarbon:oc,priority:Math.abs(phGap)>=1?'high':Math.abs(phGap)>=0.5?'medium':'low'};
 }

 waterAllocation({available,irrigationDemand,domesticDemand,environmentalReserve=0}){
  const a=Number(available), i=Number(irrigationDemand), d=Number(domesticDemand), r=Number(environmentalReserve);
  if([a,i,d,r].some(v=>v<0)) throw new Error('Water quantities cannot be negative');
  const allocatable=Math.max(0,a-r), deficit=Math.max(0,i+d-allocatable);
  return {allocatable,irrigationAllocation:Math.min(i,allocatable),domesticProtection:Math.min(d,Math.max(0,allocatable-i)),deficit,environmentalReserve:r,status:deficit>0?'DEFICIT':'BALANCED'};
 }

 climateRisk({hazardProbability,exposure,vulnerability,capacity}){
  const p=Number(hazardProbability), e=Number(exposure), v=Number(vulnerability), c=Number(capacity);
  if([p,e,v,c].some(x=>x<0)||p>1||e>1||v>1||c>1) throw new Error('Climate scores must be 0..1');
  const risk=Math.min(1,p*e*v*(1-c));
  return {risk:Number(risk.toFixed(4)),band:risk>=0.7?'critical':risk>=0.45?'high':risk>=0.2?'medium':'low',priority:1-risk};
 }

 labourProductivity({hours,outputQuantity,wagePerHour}){
  const h=Number(hours), o=Number(outputQuantity), w=Number(wagePerHour); if(!(h>0&&o>=0&&w>=0)) throw new Error('Invalid labour economics');
  return {outputPerHour:o/h,labourCost:h*w,costPerOutput:o>0?(h*w/o):null};
 }

 farmUnitEconomics({outputQuantity,salePrice,inputCost,labourCost,machineryCost,overhead=0}){
  const output=Number(outputQuantity), price=Number(salePrice), costs=[inputCost,labourCost,machineryCost,overhead].map(Number);
  if(!(output>0&&price>=0&&costs.every(x=>x>=0))) throw new Error('Invalid farm unit economics');
  const revenue=output*price,totalCost=costs.reduce((a,b)=>a+b,0),profit=revenue-totalCost;
  return {revenue,totalCost,profit,margin:revenue>0?profit/revenue:0,breakEvenPrice:totalCost/output};
 }

 async persist(moduleCode,entityId,result,actorId){
  const q=await this.db.query(`INSERT INTO m051_m100_hardening_audits (id,module_code,entity_id,validation_result,ai_enhancements,actor_id,correlation_id) VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,gen_random_uuid()) RETURNING id`,[moduleCode,entityId||null,JSON.stringify({valid:true,domainIntelligence:true}),JSON.stringify(result),actorId||null]);
  return q.rows[0];
 }
}
module.exports=new M051M100DomainIntelligenceService();
