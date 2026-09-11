'use strict';

const crypto = require('crypto');
const pool = require('../database/pool');
const assurance = require('./moduleProductionAssuranceService');

const GROUPS = {
  PLATFORM: { range:[1,10], twin:'enterprise-platform', stakeholders:['platform_owner','system_admin','security_admin','auditor','sre','developer','business_owner'], ai:['generative','analytical','predictive','prescriptive','anomaly','agentic'], erp:['configuration_governance','change_control','release_management','capacity_management','cost_governance','audit'] },
  IDENTITY: { range:[11,20], twin:'digital-trust', stakeholders:['user','tenant_admin','identity_admin','security_officer','privacy_officer','auditor'], ai:['analytical','predictive','prescriptive','anomaly','graph_ml','generative'], erp:['zero_trust','rbac_abac','maker_checker','consent','session_governance','access_review'] },
  FARMER: { range:[21,30], twin:'farmer-digital-twin', stakeholders:['farmer','household','fpo','extension_worker','ngo','bank','insurer','government','auditor'], ai:['generative','analytical','predictive','prescriptive','recommendation','document_ai','knowledge_graph','agentic'], erp:['farmer_360','kyc','eligibility','workflow','evidence','case_management','performance'] },
  LAND: { range:[31,40], twin:'farm-plot-digital-twin', stakeholders:['farmer','landowner','tenant','surveyor','gis_analyst','panchayat','revenue_officer','fpo','auditor'], ai:['geospatial','vision','analytical','predictive','prescriptive','anomaly','knowledge_graph'], erp:['land_master','temporal_ownership','lease','survey','gis','resource_mapping','provenance'] },
  COMMUNITY: { range:[41,50], twin:'village-digital-twin', stakeholders:['village_operator','panchayat','shg','cooperative','producer_group','fpo','block','district','state','ngo','investor','auditor'], ai:['generative','analytical','predictive','prescriptive','optimization','knowledge_graph','agentic','scenario_simulation'], erp:['village_master','governance','asset_management','group_ledger','development_portfolio','geo_rollup','kpi'] },
};

const SPECIAL = {
  M001:{innovation:['dependency graph','deployment blast-radius simulation','capacity/cost forecast','AI-assisted rollback plan']},
  M002:{innovation:['configuration lineage','drift intelligence','secret-risk classification','policy-as-code recommendation']},
  M003:{innovation:['tenant unit economics','quota forecasting','noisy-neighbour detection','isolation-risk scoring']},
  M004:{innovation:['organization graph','delegation analysis','span-of-control optimization','cycle/conflict detection']},
  M005:{innovation:['environment parity scoring','release-risk prediction','resilience readiness','disaster-recovery evidence']},
  M006:{innovation:['privileged-operation risk','runbook copilot','change impact simulation','self-healing recommendation with approval']},
  M007:{innovation:['feature cohort simulation','rollout anomaly detection','kill-switch governance','experiment impact analytics']},
  M008:{innovation:['terminology memory','translation quality scoring','regional language fallback','semantic consistency']},
  M009:{innovation:['cross-zone scheduling','DST risk detection','business-calendar normalization','temporal audit']},
  M010:{innovation:['enterprise policy graph','master-data dependency analysis','configuration conflict detection','change recommendation']},
  M011:{innovation:['account lifecycle intelligence','dormant-user risk','segregation-of-duties review','identity graph']},
  M012:{innovation:['adaptive authentication','credential abuse anomaly','risk-based challenge','auth journey analytics']},
  M013:{innovation:['deny-by-default policy reasoning','toxic access detection','privilege escalation graph','explainable authorization']},
  M014:{innovation:['role mining','least-privilege optimization','role similarity clustering','SoD conflict detection']},
  M015:{innovation:['permission blast-radius','wildcard risk','policy simulation','entitlement lifecycle']},
  M016:{innovation:['SSO provider health','federation anomaly','redirect/nonce policy checks','identity-provider failover']},
  M017:{innovation:['factor-strength scoring','MFA fatigue detection','recovery abuse detection','adaptive factor recommendation']},
  M018:{innovation:['identity assurance graph','duplicate identity detection','proofing evidence confidence','verifiable credential readiness']},
  M019:{innovation:['purpose limitation enforcement','consent expiry prediction','consent lineage','downstream-use conflict detection']},
  M020:{innovation:['session anomaly detection','concurrent-session risk','token lineage','continuous trust reassessment']},
  M021:{innovation:['farmer 360','duplicate farmer resolution','onboarding next-best-action','service eligibility graph']},
  M022:{innovation:['livelihood segmentation','profile completeness','household/farm relationship graph','personalized opportunity feed']},
  M023:{innovation:['household dependency model','livelihood resilience','workforce availability','benefit targeting']},
  M024:{innovation:['document AI','OCR/evidence extraction','identity mismatch detection','human-verifier queue']},
  M025:{innovation:['evidence reconciliation','verification confidence','conflict detection','reviewer workload prioritization']},
  M026:{innovation:['skills ontology','skill-gap analytics','training pathway','market-linked skill recommendation']},
  M027:{innovation:['certificate expiry forecast','issuer trust registry','credential verification','certification opportunity matching']},
  M028:{innovation:['RAG advisory','context-aware agronomic/economic guidance','evidence citation','feedback learning']},
  M029:{innovation:['welfare risk triage','service referral','FHIR-compatible observation envelope where lawful','strict non-diagnostic AI boundary'], interoperability:['FHIR-style Observation/Questionnaire mapping','ICD/SNOMED only in separately governed clinical integration; never inferred by this module']},
  M030:{innovation:['multidimensional farmer performance','peer benchmarking','causal-driver exploration','income/productivity opportunity analysis']},
  M031:{innovation:['land provenance graph','conflicting-record detection','title lineage','geospatial reconciliation']},
  M032:{innovation:['temporal ownership graph','overlap/conflict detection','succession/transfer workflow','evidence confidence']},
  M033:{innovation:['lease risk forecast','expiry/renewal prediction','rent benchmark support','overlap prevention']},
  M034:{innovation:['topology validation','parcel overlap detection','area reconciliation','remote-sensing readiness']},
  M035:{innovation:['multi-layer GIS reasoning','land-use suitability','proximity analytics','spatial decision support']},
  M036:{innovation:['soil digital twin','crop suitability','nutrient trend','soil-biology vocabulary support'], interoperability:['controlled soil organism/taxonomy vocabulary when laboratory data exists']},
  M037:{innovation:['water-source digital twin','seasonal stress forecast','irrigation prioritization','source reliability scoring']},
  M038:{innovation:['boundary versioning','topology conflict','jurisdiction impact','geofence policy']},
  M039:{innovation:['survey quality scoring','enumerator anomaly','missing-evidence detection','sampling coverage optimization']},
  M040:{innovation:['document-to-record reconciliation','record provenance','digitization confidence','duplicate/conflict resolution']},
  M041:{innovation:['village 360','readiness index','opportunity map','service/infrastructure gap intelligence']},
  M042:{innovation:['resolution-to-action workflow','governance delay prediction','participation analytics','public-action evidence']},
  M043:{innovation:['block portfolio optimization','coverage gaps','resource allocation scenarios','village cluster analysis']},
  M044:{innovation:['district comparative intelligence','investment prioritization','programme performance','risk heatmap']},
  M045:{innovation:['state portfolio intelligence','regional disparity analysis','policy scenario simulation','programme orchestration']},
  M046:{innovation:['SHG financial health','livelihood opportunity engine','meeting/action intelligence','credit readiness']},
  M047:{innovation:['cooperative member economics','share/ledger reconciliation','governance risk','capital adequacy insight']},
  M048:{innovation:['producer aggregation potential','market readiness','collective input/output planning','buyer matching']},
  M049:{innovation:['asset digital twin','predictive maintenance','utilization optimization','replacement/investment forecast']},
  M050:{innovation:['development portfolio optimization','baseline-to-outcome measurement','scenario simulation','impact/economic multiplier analysis']},
};

function codeOf(n){ return `M${String(n).padStart(3,'0')}`; }
function groupFor(n){ return Object.entries(GROUPS).find(([,g])=>n>=g.range[0]&&n<=g.range[1]); }

const MODULES = Object.fromEntries(Array.from({length:50},(_,i)=>{
  const n=i+1, code=codeOf(n), contract=assurance.CONTRACTS[code];
  const [groupName,g]=groupFor(n);
  const special=SPECIAL[code]||{};
  return [code,{
    module:code,
    name:contract?.name||code,
    domain:contract?.domain||groupName,
    group:groupName,
    digitalTwin:g.twin,
    stakeholders:g.stakeholders,
    erpCapabilities:g.erp,
    aiCapabilities:g.ai,
    innovation:special.innovation||[],
    interoperability:special.interoperability||[],
    knowledgeGraph:true,
    semanticLayer:true,
    evidenceFirstAI:true,
    humanApprovalRequired:true,
    autonomousConsequentialAction:false,
    certification:['authoritative_service','controller','routes','database_model','ui','domain_invariant','audit_evidence','security_scope','workflow_test','ai_evaluation'],
  }];
}));

function profile(moduleCode){
  const p=MODULES[moduleCode];
  if(!p) throw Object.assign(new Error(`Unsupported module ${moduleCode}`),{code:'UNKNOWN_MODULE',statusCode:404});
  return p;
}

function buildKnowledgeGraphContract(moduleCode,payload={}){
  const p=profile(moduleCode);
  const entityId=payload.id||payload[`${p.name.toLowerCase().replace(/[^a-z0-9]+/g,'_')}_id`]||payload.farmer_id||payload.village_id||payload.land_id||null;
  return { module:moduleCode, entityType:p.digitalTwin, entityId, graphNamespace:'afrera-operational-knowledge-graph', relationships:['belongs_to_geography','linked_to_actor','supported_by_evidence','produces_events','contributes_to_kpi'], provenanceRequired:true };
}

function buildDigitalTwin(moduleCode,payload={}){
  const p=profile(moduleCode);
  return { twinType:p.digitalTwin, module:moduleCode, observedAt:new Date().toISOString(), source:'authoritative-module-workflow', state:payload, dimensions:['identity','operations','economics','risk','compliance','relationships','outcomes'], version:1 };
}

function governance(moduleCode,request={}){
  const p=profile(moduleCode);
  const consequential=Boolean(request.execute||request.commit||request.approve||request.change_state||request.financial_effect);
  return { module:moduleCode, consequential, allowedAutonomy: consequential?'recommend_only':'bounded_assist', humanApprovalRequired:consequential||p.humanApprovalRequired, evidenceRequired:true, auditRequired:true, explainabilityRequired:true, modelOutputCannotOverrideAuthoritativeRecord:true };
}

function medicalBiologicalBoundary(moduleCode){
  if(moduleCode==='M029') return {mode:'welfare_referral_only', clinicalDiagnosis:false, medicationRecommendation:false, interoperability:MODULES.M029.interoperability, requiresExplicitConsent:true, restrictedAccess:true};
  if(moduleCode==='M036') return {mode:'soil_biology_only', humanClinicalData:false, interoperability:MODULES.M036.interoperability};
  return {mode:'not_applicable', humanClinicalData:false};
}

async function evaluate(moduleCode,payload={},context={}){
  const p=profile(moduleCode);
  const validation=await assurance.assess(moduleCode,payload);
  const gov=governance(moduleCode,context);
  const result={
    evaluationId:crypto.randomUUID(), module:moduleCode, profile:p, validation,
    digitalTwin:buildDigitalTwin(moduleCode,payload),
    knowledgeGraph:buildKnowledgeGraphContract(moduleCode,payload),
    governance:gov,
    interoperability:medicalBiologicalBoundary(moduleCode),
    decisionSupport:{
      analytical:{enabled:true, purpose:'describe state, variance, trend, segmentation and root-cause candidates'},
      predictive:{enabled:true, purpose:'forecast relevant risk/demand/capacity/outcome only when trained evidence exists'},
      prescriptive:{enabled:true, purpose:'rank bounded actions and scenarios; never silently execute consequential change'},
      generative:{enabled:true, purpose:'explain, summarize, draft, query and synthesize grounded evidence'},
      agentic:{enabled:true, purpose:'orchestrate approved tools/workflows with policy, scope, audit and stop conditions'},
    },
    innovations:p.innovation,
    certificationReady:validation.valid && !gov.consequential,
    createdAt:new Date().toISOString(),
  };
  return result;
}

async function recordEvaluation(moduleCode,payload,result,actorId=null){
  const q=await pool.query(`INSERT INTO m001_m050_ai_native_evaluations
    (id,module_id,actor_id,input_payload,evaluation,governance_state,created_at)
    VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING id,created_at`,[
      result.evaluationId,moduleCode,actorId,JSON.stringify(payload),JSON.stringify(result),JSON.stringify(result.governance)
    ]);
  return {...result,persisted:true,recordedAt:q.rows[0].created_at};
}

async function assessAndRecord(moduleCode,payload={},context={}){
  const result=await evaluate(moduleCode,payload,context);
  if(!result.validation.valid){
    const e=new Error(`Production contract failed for ${moduleCode}: ${[...result.validation.missing,...result.validation.violations].join(', ')}`);
    e.code='VALIDATION_ERROR'; e.statusCode=422; e.details=result.validation; throw e;
  }
  return recordEvaluation(moduleCode,payload,result,context.actorId||null);
}

function portfolio(){
  const modules=Object.values(MODULES);
  return {count:modules.length,modules,architecture:{erp:true,digitalTwin:true,knowledgeGraph:true,analyticalAI:true,predictiveAI:true,prescriptiveAI:true,generativeAI:true,governedAgents:true,evidenceFirst:true,humanApproval:true},medicalBiologicalBoundary:{clinicalSystem:false,applicableModules:['M029','M036']}};
}

module.exports={MODULES,profile,portfolio,governance,buildDigitalTwin,buildKnowledgeGraphContract,medicalBiologicalBoundary,evaluate,assessAndRecord};
