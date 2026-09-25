'use strict';

const { ERP_DOMAINS } = require('../services/erp/unifiedERPRegistry');

const OBJECTIVE_PROFILES = Object.freeze({
  finance: {
    id:'erp.finance.cost_and_working_capital',
    description:'Select the feasible finance/working-capital alternative with the lowest normalized cost, liquidity, timing and control penalty among supplied candidates.',
    metrics:{working_capital_cost:'min',cash_conversion_days:'min',late_payment_cost:'min',control_risk:'min',liquidity_headroom:'max'},
    monetary:['working_capital_cost','late_payment_cost'],
  },
  supply_chain: {
    id:'erp.supply_chain.total_landed_cost',
    description:'Select the feasible sourcing/supply alternative minimizing landed, holding, stockout, expedite and supplier-risk penalties.',
    metrics:{landed_cost:'min',inventory_holding_cost:'min',stockout_cost:'min',expedite_cost:'min',supplier_risk:'min',service_level:'max'},
    monetary:['landed_cost','inventory_holding_cost','stockout_cost','expedite_cost'],
  },
  sales: {
    id:'erp.sales.margin_and_cost_to_serve',
    description:'Select the feasible sales/channel alternative balancing contribution margin, cost-to-serve, returns and discount leakage.',
    metrics:{contribution_margin:'max',cost_to_serve:'min',return_cost:'min',discount_leakage:'min',service_level:'max'},
    monetary:['cost_to_serve','return_cost','discount_leakage'],
  },
  marketing: {
    id:'erp.marketing.acquisition_efficiency',
    description:'Select the feasible campaign alternative maximizing qualified acquisition while minimizing campaign, acquisition and promotion-margin cost.',
    metrics:{campaign_cost:'min',cost_per_acquisition:'min',qualified_conversion_rate:'max',promotion_margin_erosion:'min',retention_rate:'max'},
    monetary:['campaign_cost','promotion_margin_erosion'],
  },
  logistics: {
    id:'erp.logistics.total_delivery_cost',
    description:'Select the feasible logistics alternative minimizing freight, fuel, detention, spoilage and failed-delivery cost while protecting SLA.',
    metrics:{freight_cost:'min',fuel_cost:'min',detention_cost:'min',spoilage_cost:'min',failed_delivery_cost:'min',sla_attainment:'max'},
    monetary:['freight_cost','fuel_cost','detention_cost','spoilage_cost','failed_delivery_cost'],
    specializedObjectives:['logistics.corridor_allocation','coldstorage.bay_allocation'],
  },
  crm: {
    id:'erp.crm.service_efficiency',
    description:'Select the feasible customer-service alternative minimizing handling, repeat-contact and SLA-breach cost while maximizing resolution quality.',
    metrics:{case_handling_cost:'min',repeat_contact_cost:'min',sla_breach_cost:'min',first_contact_resolution:'max',customer_retention:'max'},
    monetary:['case_handling_cost','repeat_contact_cost','sla_breach_cost'],
  },
  erm: {
    id:'erp.erm.resource_utilisation',
    description:'Select the feasible rural/enterprise resource configuration minimizing idle/shared-capacity and service-delivery cost while maximizing utilization.',
    metrics:{idle_capacity_cost:'min',service_delivery_cost:'min',utilisation:'max',coverage:'max',accessibility_penalty:'min'},
    monetary:['idle_capacity_cost','service_delivery_cost'],
  },
  workforce: {
    id:'erp.workforce.total_workforce_cost',
    description:'Select the feasible workforce plan minimizing overtime, idle time, attrition and training cost subject to skill and staffing constraints.',
    metrics:{overtime_cost:'min',idle_time_cost:'min',attrition_cost:'min',training_cost:'min',skill_coverage:'max',schedule_coverage:'max'},
    monetary:['overtime_cost','idle_time_cost','attrition_cost','training_cost'],
  },
  insurance: {
    id:'erp.insurance.claim_and_risk_cost',
    description:'Select the feasible insurance/risk treatment minimizing expected loss, claim leakage, investigation and reinsurance cost without bypassing underwriting authority.',
    metrics:{expected_loss:'min',claim_leakage_cost:'min',investigation_cost:'min',reinsurance_cost:'min',coverage_adequacy:'max',fraud_risk:'min'},
    monetary:['expected_loss','claim_leakage_cost','investigation_cost','reinsurance_cost'],
  },
  retail: {
    id:'erp.retail.store_economics',
    description:'Select the feasible retail alternative minimizing markdown, shrinkage, stockout and store operating cost while maximizing availability and margin.',
    metrics:{markdown_cost:'min',shrinkage_cost:'min',stockout_cost:'min',store_labor_cost:'min',inventory_holding_cost:'min',gross_margin:'max'},
    monetary:['markdown_cost','shrinkage_cost','stockout_cost','store_labor_cost','inventory_holding_cost'],
  },
  ecommerce: {
    id:'erp.ecommerce.order_economics',
    description:'Select the feasible e-commerce fulfillment alternative minimizing fulfillment, returns, payment and marketplace cost while protecting delivery service.',
    metrics:{fulfilment_cost:'min',return_cost:'min',payment_cost:'min',marketplace_fee:'min',failed_delivery_cost:'min',delivery_service:'max'},
    monetary:['fulfilment_cost','return_cost','payment_cost','marketplace_fee','failed_delivery_cost'],
  },
  production: {
    id:'erp.production.unit_economics',
    description:'Select the feasible production/process alternative minimizing yield loss, scrap, rework, energy, labor and setup cost while meeting output/quality constraints.',
    metrics:{yield_loss_cost:'min',scrap_cost:'min',rework_cost:'min',energy_cost:'min',labor_cost:'min',setup_cost:'min',throughput:'max'},
    monetary:['yield_loss_cost','scrap_cost','rework_cost','energy_cost','labor_cost','setup_cost'],
  },
  quality: {
    id:'erp.quality.cost_of_quality',
    description:'Select the feasible quality-control alternative minimizing poor-quality, rework, scrap, testing and recall-risk cost while meeting release criteria.',
    metrics:{poor_quality_cost:'min',rework_cost:'min',scrap_cost:'min',testing_cost:'min',recall_expected_cost:'min',defect_escape_rate:'min'},
    monetary:['poor_quality_cost','rework_cost','scrap_cost','testing_cost','recall_expected_cost'],
  },
  asset: {
    id:'erp.asset.lifecycle_cost',
    description:'Select the feasible asset strategy minimizing downtime, maintenance, spares, energy and failure cost while maximizing availability/utilization.',
    metrics:{downtime_cost:'min',maintenance_cost:'min',spares_cost:'min',energy_cost:'min',failure_expected_cost:'min',availability:'max'},
    monetary:['downtime_cost','maintenance_cost','spares_cost','energy_cost','failure_expected_cost'],
  },
  projects: {
    id:'erp.projects.delivery_cost',
    description:'Select the feasible project alternative minimizing cost variance, delay, change-order, rework and idle-resource cost while meeting scope/schedule constraints.',
    metrics:{cost_variance:'min',delay_cost:'min',change_order_cost:'min',rework_cost:'min',resource_idle_cost:'min',schedule_attainment:'max'},
    monetary:['cost_variance','delay_cost','change_order_cost','rework_cost','resource_idle_cost'],
  },
  governance: {
    id:'erp.governance.control_cost',
    description:'Select the feasible control/remediation alternative minimizing control-failure, remediation, penalty and fraud-loss exposure while maximizing control coverage.',
    metrics:{control_failure_cost:'min',audit_remediation_cost:'min',penalty_expected_cost:'min',fraud_expected_loss:'min',control_coverage:'max'},
    monetary:['control_failure_cost','audit_remediation_cost','penalty_expected_cost','fraud_expected_loss'],
  },
  data_ai: {
    id:'erp.data_ai.intelligence_cost',
    description:'Select the feasible data/AI execution alternative minimizing inference, tool, latency, retry and human-review cost while satisfying quality/security/SLA constraints.',
    metrics:{model_cost:'min',tool_cost:'min',latency_cost:'min',retry_cost:'min',human_review_cost:'min',quality_score:'max'},
    monetary:['model_cost','tool_cost','latency_cost','retry_cost','human_review_cost'],
  },
});

function finite(value){const n=Number(value);return Number.isFinite(n)?n:null;}
function clamp(v,min=0,max=1){return Math.max(min,Math.min(max,v));}

function compare(value,operator,threshold){
  if(operator==='<=')return value<=threshold;
  if(operator==='<')return value<threshold;
  if(operator==='>=')return value>=threshold;
  if(operator==='>')return value>threshold;
  if(operator==='==')return value===threshold;
  if(operator==='!=')return value!==threshold;
  throw new Error('Unsupported hard-constraint operator: '+operator);
}

function evaluateConstraints(candidate,constraints=[]){
  const violations=[];
  for(const c of constraints){
    const value=finite(candidate.metrics?.[c.metric]);
    const threshold=finite(c.value);
    if(value==null||threshold==null){
      violations.push({metric:c.metric,reason:'missing_or_invalid_value'});
      continue;
    }
    if(!compare(value,c.operator||'<=',threshold)){
      violations.push({metric:c.metric,operator:c.operator||'<=',threshold,actual:value});
    }
  }
  return {feasible:violations.length===0,violations};
}

function normalizeMetric(value,min,max,direction){
  if(min===max)return 0;
  const n=(value-min)/(max-min);
  return direction==='max'?1-clamp(n):clamp(n);
}

function validate(domainId,input={}){
  const profile=OBJECTIVE_PROFILES[domainId];
  if(!profile)throw new Error('Unknown ERP optimization domain: '+domainId);
  if(!Array.isArray(input.candidates)||input.candidates.length===0)throw new Error('candidates[] is required');
  if(input.candidates.length>5000)throw new Error('candidate count exceeds 5000');
  const ids=input.candidates.map(c=>String(c.id||''));
  if(ids.some(id=>!id)||new Set(ids).size!==ids.length)throw new Error('candidate ids must be non-empty and unique');
  return profile;
}

function optimize(domainId,input={}){
  const profile=validate(domainId,input);
  const constraints=Array.isArray(input.hardConstraints)?input.hardConstraints:[];
  const weights=input.weights||{};
  const candidates=input.candidates.map(c=>({
    id:String(c.id),
    metrics:{...(c.metrics||{})},
    metadata:c.metadata||{},
    constraint:evaluateConstraints(c,constraints),
  }));
  const feasible=candidates.filter(c=>c.constraint.feasible);
  if(!feasible.length){
    return {
      objectiveId:profile.id,domainId,status:'infeasible',feasible:false,selected:null,
      candidatesEvaluated:candidates.length,violations:candidates.map(c=>({id:c.id,violations:c.constraint.violations})),
      guarantee:'No feasible candidate was supplied; nothing was selected.',
    };
  }

  const metricStats={};
  for(const [metric,direction] of Object.entries(profile.metrics)){
    const vals=feasible.map(c=>finite(c.metrics[metric])).filter(v=>v!=null);
    metricStats[metric]={direction,min:vals.length?Math.min(...vals):null,max:vals.length?Math.max(...vals):null};
  }

  const scored=feasible.map(c=>{
    let total=0,totalWeight=0;
    const factors=[];
    for(const [metric,spec] of Object.entries(metricStats)){
      const value=finite(c.metrics[metric]);
      if(value==null||spec.min==null)continue;
      const weight=finite(weights[metric])??1;
      if(weight<=0)continue;
      const loss=normalizeMetric(value,spec.min,spec.max,spec.direction);
      total+=loss*weight; totalWeight+=weight;
      factors.push({metric,value,direction:spec.direction,weight,normalizedLoss:loss});
    }
    const businessCost=profile.monetary.reduce((sum,metric)=>sum+(finite(c.metrics[metric])??0),0);
    return {...c,score:totalWeight?total/totalWeight:0,businessCost,factors};
  }).sort((a,b)=>a.score-b.score||a.businessCost-b.businessCost||a.id.localeCompare(b.id));

  const selected=scored[0];
  const baselineId=input.baselineCandidateId?String(input.baselineCandidateId):null;
  const baseline=baselineId?scored.find(c=>c.id===baselineId)||candidates.find(c=>c.id===baselineId):null;
  const baselineCost=baseline?.businessCost ?? (baseline?profile.monetary.reduce((sum,m)=>sum+(finite(baseline.metrics?.[m])??0),0):null);
  const savings=baselineCost==null?null:baselineCost-selected.businessCost;

  return {
    objectiveId:profile.id,
    domainId,
    status:'evaluated',
    feasible:true,
    selected:{id:selected.id,score:selected.score,businessCost:selected.businessCost,metrics:selected.metrics,metadata:selected.metadata,factors:selected.factors},
    baseline:baseline?{id:baseline.id,businessCost:baselineCost}:null,
    savings:savings==null?null:{amount:savings,percentage:baselineCost?Math.round((savings/baselineCost)*10000)/100:null},
    candidatesEvaluated:candidates.length,
    feasibleCandidates:feasible.length,
    infeasibleCandidates:candidates.filter(c=>!c.constraint.feasible).map(c=>({id:c.id,violations:c.constraint.violations})),
    profile:{description:profile.description,metrics:profile.metrics,monetaryMetrics:profile.monetary,specializedObjectives:profile.specializedObjectives||[]},
    guarantee:'Exact ranking among the supplied feasible candidates under the declared normalized objective; not a proof of a global optimum outside that candidate set.',
  };
}

function listObjectives(){
  return Object.entries(OBJECTIVE_PROFILES).map(([domainId,p])=>({domainId,id:p.id,description:p.description,metrics:p.metrics,monetary:p.monetary,specializedObjectives:p.specializedObjectives||[]}));
}

function coverage(){
  const domains=Object.keys(ERP_DOMAINS);
  return {
    erpDomains:domains.length,
    executableObjectiveDomains:domains.filter(id=>OBJECTIVE_PROFILES[id]).length,
    missingObjectiveDomains:domains.filter(id=>!OBJECTIVE_PROFILES[id]),
    objectives:listObjectives(),
  };
}

module.exports={OBJECTIVE_PROFILES,optimize,listObjectives,coverage,evaluateConstraints,normalizeMetric};
