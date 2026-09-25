'use strict';

const { logger } = require('../../utils/logger');
const governedGateway = require('../aiGatewayService');
const { dispatch } = require('../../core/ai/aiEngineDispatcher');

const SPECIALIST_CONTRACTS = Object.freeze({
  crop_yield: { kind:'prediction', engine:null, fields:{ predicted_yield:null, confidence:null, factors:[], timeline:null } },
  weather: { kind:'prediction', engine:null, fields:{ temperature:null, humidity:null, rainfall:null, current_conditions:{}, confidence:null, forecast_days:null } },
  market_price: { kind:'prediction', engine:null, fields:{ predicted_price:null, trend:null, confidence:null, time_horizon:null } },
  pest_outbreak: { kind:'prediction', engine:null, fields:{ risk_level:null, confidence:null, affected_area:null, likely_pests:[], recommended_action:null } },
  resource_allocation: { kind:'optimization', engine:'optimization', fields:{ optimized_allocation:null, efficiency_gain:null, cost_reduction:null } },
  scheduling: { kind:'optimization', engine:null, fields:{ optimized_schedule:null, time_saved:null, resource_utilization:null } },
  inventory: { kind:'optimization', engine:null, fields:{ optimized_inventory:null, waste_reduction:null, cost_savings:null } },
  logistics: { kind:'optimization', engine:'optimization', fields:{ optimized_routes:null, distance_saved:null, fuel_savings:null } },
  irrigation: { kind:'optimization', engine:null, fields:{ optimized_schedule:null, water_savings:null, efficiency_improvement:null, cost_savings:null, implementation_guide:null, monitoring_requirements:null } },
  soil: { kind:'analysis', engine:null, fields:{ soil_health_score:null, nutrient_levels:{}, ph_level:null, organic_matter:null, texture:null, recommendations:[] } },
  water: { kind:'analysis', engine:null, fields:{ water_quality_score:null, parameters:{}, issues:[], recommendations:[] } },
  crop_health: { kind:'analysis', engine:null, fields:{ health_score:null, stress_factors:[], issues:[], recommendations:[] } },
  financial: { kind:'analysis', engine:null, fields:{ financial_health:null, profitability:null, risk_factors:[], recommendations:[] } },
  system: { kind:'analysis', engine:null, fields:{ score:null, bottlenecks:[], recommendations:[], forecast:{} } },
  crop_selection: { kind:'recommendation', engine:null, fields:{ recommended_crops:[], confidence:null, reasoning:null, expected_yields:{}, market_outlook:{}, resource_requirements:{}, risk_factors:[], alternatives:[] } },
  fertilizer: { kind:'recommendation', engine:null, fields:{ fertilizer_type:null, application_rate:null, timing:null, method:null, nutrient_breakdown:{}, cost_estimate:null, environmental_impact:{}, alternatives:[] } },
  irrigation_recommendation: { kind:'recommendation', engine:null, fields:{ irrigation_method:null, frequency:null, duration:null, confidence:null } },
  pest_control: { kind:'recommendation', engine:null, fields:{ pest_control_method:null, action:null, products:[], confidence:null } },
  role_matching: { kind:'recommendation', engine:null, fields:{ matches:[], confidence:null } },
  salary_market: { kind:'analysis', engine:null, fields:{ benchmark:null, range:null, confidence:null } },
  career_path: { kind:'analysis', engine:null, fields:{ paths:[], confidence:null } },
  role_assignment: { kind:'optimization', engine:null, fields:{ assignments:[], confidence:null } },
  permission_usage: { kind:'analysis', engine:null, fields:{ anomalies:[], recommendations:[], confidence:null } },
  user_behavior: { kind:'analysis', engine:null, fields:{ segments:[], anomalies:[], confidence:null } },
  user_segmentation: { kind:'analysis', engine:null, fields:{ segments:[], confidence:null } },
});

function clone(value){ return JSON.parse(JSON.stringify(value)); }

function normalizeInvocation(modelType, payload, third, defaultKind){
  if(modelType && typeof modelType === 'object' && !Array.isArray(modelType)){
    const obj=modelType;
    return {
      modelType:String(obj.modelType||obj.type||obj.capability||defaultKind||'generic'),
      payload:obj.parameters||obj.data||obj.context||obj.input||obj,
      third:obj.constraints||obj.analysisType||obj.options||third||{},
    };
  }
  return {modelType:String(modelType||defaultKind||'generic'),payload:payload||{},third:third||{}};
}

function unavailable(modelType, kind, fields={}, reason){
  return {
    ...clone(fields),
    implemented:false,
    status:'not_implemented',
    model_type:modelType,
    capability_kind:kind,
    confidence:null,
    reason:reason||('No validated '+kind+' engine is bound to '+modelType+' in this compatibility gateway.'),
    provenance:{source:'services/ai/aiGatewayService',generated:false},
  };
}

class AiGatewayService {
  constructor(){
    this.performanceMetrics=new Map();
  }

  contract(modelType,kind){
    const c=SPECIALIST_CONTRACTS[modelType];
    if(c && (!kind || c.kind===kind)) return c;
    return {kind:kind||'generic',engine:null,fields:{}};
  }

  async _tryEngine(modelType,kind,payload,third){
    const contract=this.contract(modelType,kind);
    if(!contract.engine) return unavailable(modelType,kind,contract.fields);
    try{
      const result=await dispatch(contract.engine,{
        modelType,
        parameters:payload,
        constraints:kind==='optimization'?third:{},
        context:kind!=='optimization'?third:{},
      });
      return {
        ...clone(contract.fields),
        implemented:true,
        status:'executed',
        model_type:modelType,
        capability_kind:kind,
        result,
        confidence:null,
        provenance:{source:'aiEngineDispatcher',engine:contract.engine,generated:false},
      };
    }catch(error){
      logger.warn('Specialist AI engine unavailable', {modelType,kind,engine:contract.engine,error:error.message});
      return unavailable(modelType,kind,contract.fields,'Bound engine '+contract.engine+' is currently unavailable: '+error.message);
    }
  }

  async predict(modelType,parameters={},context={}){
    const a=normalizeInvocation(modelType,parameters,context,'prediction');
    const start=Date.now();
    const result=await this._tryEngine(a.modelType,'prediction',a.payload,a.third);
    this.trackPerformance(a.modelType,Date.now()-start,result.implemented===true);
    return result;
  }

  async optimize(modelType,parameters={},constraints={}){
    const a=normalizeInvocation(modelType,parameters,constraints,'optimization');
    const start=Date.now();
    const result=await this._tryEngine(a.modelType,'optimization',a.payload,a.third);
    this.trackPerformance(a.modelType,Date.now()-start,result.implemented===true);
    return result;
  }

  async analyze(modelType,data={},analysisType='standard'){
    const a=normalizeInvocation(modelType,data,analysisType,'analysis');
    const start=Date.now();
    const result=await this._tryEngine(a.modelType,'analysis',a.payload,a.third);
    this.trackPerformance(a.modelType,Date.now()-start,result.implemented===true);
    return result;
  }

  async recommend(modelType,context={},options={}){
    const a=normalizeInvocation(modelType,context,options,'recommendation');
    const start=Date.now();
    const contract=this.contract(a.modelType,'recommendation');
    if(contract.engine){
      const result=await this._tryEngine(a.modelType,'recommendation',a.payload,a.third);
      this.trackPerformance(a.modelType,Date.now()-start,result.implemented===true);
      return result;
    }

    const governed=await governedGateway.run({
      moduleId:'specialist-ai-compatibility',
      capability:'recommend-'+a.modelType,
      prompt:[
        "Provide advisory reasoning for capability '"+a.modelType+"'.",
        'Do not invent measurements, dosages, prices, diagnoses, or completed actions.',
        'CONTEXT_JSON: '+JSON.stringify(a.payload),
      ].join('\n'),
      context:a.third||{},
    });

    const result={
      ...clone(contract.fields),
      implemented:governed.success===true,
      status:governed.success?'generated_advisory':'not_configured',
      model_type:a.modelType,
      capability_kind:'recommendation',
      content:governed.content||null,
      confidence:null,
      reason:governed.success?null:(governed.error||'No governed provider is configured.'),
      provenance:{
        source:'governed-ai-gateway',
        provider:governed.provider||null,
        model:governed.model||null,
        generated:governed.success===true,
      },
      safety:{humanReviewRequired:true,externalActionsTaken:false},
    };
    this.trackPerformance(a.modelType,Date.now()-start,result.implemented===true);
    return result;
  }

  trackPerformance(modelType,latency,success){
    const current=this.performanceMetrics.get(modelType)||{total_calls:0,successful_calls:0,failed_calls:0,total_latency:0,avg_latency:0};
    current.total_calls+=1;
    current.total_latency+=Number(latency)||0;
    current.avg_latency=current.total_latency/current.total_calls;
    if(success) current.successful_calls+=1; else current.failed_calls+=1;
    this.performanceMetrics.set(modelType,current);
  }

  getPerformanceMetrics(modelType=null){
    if(modelType) return this.performanceMetrics.get(modelType)||{};
    return Object.fromEntries(this.performanceMetrics);
  }

  async healthCheck(){
    const governed=await governedGateway.healthCheck();
    return {
      status: governed.status==='configured'?'configured':'degraded',
      governedProvider:governed,
      specialistContracts:Object.keys(SPECIALIST_CONTRACTS).length,
      executableSpecialistContracts:Object.entries(SPECIALIST_CONTRACTS).filter(([,c])=>Boolean(c.engine)).map(([id])=>id),
      truthRule:'Unbound specialist capabilities return implemented:false and null structured fields; no fabricated model accuracy or recommendations.',
      performance:this.getPerformanceMetrics(),
      timestamp:new Date().toISOString(),
    };
  }
}

const singleton=new AiGatewayService();
module.exports=singleton;
module.exports.AiGatewayService=AiGatewayService;
module.exports.SPECIALIST_CONTRACTS=SPECIALIST_CONTRACTS;
