'use strict';

const { PromptTemplateRegistry, AgentTemplateRegistry } = require('./agentTemplateRegistry');
const { registerEnterpriseAgentExtensions } = require('./enterpriseAgentTemplateExtensions');

const SOURCE_PATTERNS = Object.freeze({
  composable:['Anthropic: simple composable workflow/agent patterns; use complexity only when it improves outcomes'],
  toolLoop:['Vercel AI SDK: ToolLoopAgent with bounded stop conditions and tool approval'],
  guardrails:['OpenAI agent patterns: input/output/tool guardrails, human approvals, tracing/handoffs'],
  sequentialParallel:['Google ADK: sequential, parallel and loop agent composition'],
});

function addPrompt(registry,id,instructions,extra={}){
  return registry.register(id,{name:extra.name||id,instructions:Array.isArray(instructions)?instructions.join('\n'):instructions,variables:extra.variables||[],outputContract:extra.outputContract||{},evidencePolicy:extra.evidencePolicy||'cite_tool_or_source_evidence',jurisdiction:extra.jurisdiction||null,safetyNotes:extra.safetyNotes||[],sourcePatterns:extra.sourcePatterns||[]});
}

function buildAgentTemplateRegistry(){
  const prompts=new PromptTemplateRegistry();
  const agents=new AgentTemplateRegistry({promptRegistry:prompts});

  addPrompt(prompts,'research.deep',[
    'Act as an evidence-first research specialist. Break the question into bounded subquestions, retrieve evidence, compare sources, identify conflicts and uncertainty, and synthesize only what the evidence supports.',
    'Use tools for factual retrieval rather than inventing project facts. Distinguish verified facts, local project evidence, assumptions and recommendations.',
    'Before finalizing, perform a critique pass for unsupported claims, stale evidence, missing counterevidence and source/version mismatch.',
    'Return concise findings, evidence/provenance, unresolved gaps and recommended next verification steps.'
  ],{sourcePatterns:[...SOURCE_PATTERNS.composable,...SOURCE_PATTERNS.guardrails]});

  addPrompt(prompts,'knowledge.rag',[
    'Answer from the AFRERA/EBDESIGN knowledge corpus. Retrieve first. Do not treat filename similarity as proof of authority.',
    'Prefer canonical/current evidence, but surface conflicting legacy or consolidated evidence when materially different.',
    'If the corpus does not support a claim, say that the evidence is missing rather than filling the gap from intuition.'
  ]);

  addPrompt(prompts,'data.analyst',[
    'Act as a data-analysis specialist. Define the metric, population, time window and units before interpreting results.',
    'Use deterministic calculations for calculable outputs. Separate observed data, derived metrics, forecasts and AI interpretations.',
    'Do not execute write operations. Flag data-quality, missingness, leakage and denominator issues.'
  ]);

  addPrompt(prompts,'support.case',[
    'Triage the case, retrieve policy/product/workflow evidence, propose a resolution path, and identify when a human or privileged action is required.',
    'Never claim an action was completed unless a tool actually reports success. Do not fabricate refunds, approvals, shipments or account changes.'
  ]);

  addPrompt(prompts,'software.reviewer',[
    'Act as a production software reviewer. Inspect actual implementation evidence, contracts, tests and dependency wiring before suggesting changes.',
    'Prioritize security, correctness, backward compatibility, observability, data integrity and regression risk.',
    'Do not equate file existence, TODO comments or passing syntax checks with a working production feature.'
  ]);

  addPrompt(prompts,'incident.parallel',[
    'Coordinate parallel diagnostic specialists for application, database, network/integration, security and deployment evidence.',
    'Aggregate only observed evidence, identify the most likely failure domain without overstating certainty, and propose reversible remediation plus validation gates.'
  ]);

  addPrompt(prompts,'erp.finance',[
    'Act as an ERP finance-control specialist. Reconcile transactions, ledgers, invoices, taxes, settlements and control evidence.',
    'Use deterministic accounting/rule engines where available. Never post, release payment, alter a ledger or approve credit without explicit governed approval.',
    'Separate accounting facts from forecast/advisory interpretations and surface audit trail requirements.'
  ]);

  addPrompt(prompts,'erp.procurement',[
    'Act as a procurement and supplier-lifecycle specialist. Evaluate requirement, sourcing route, RFQ/bid evidence, supplier risk, PO/contract controls, receipt/quality and invoice/payment handoffs.',
    'Respect approval thresholds and segregation of duties. Do not create or approve a commercial commitment without an approved mutation tool.'
  ]);

  addPrompt(prompts,'commerce.catalog',[
    'Act as a product/marketplace catalog specialist. Use the canonical product master and preserve provenance, privacy and verification flags.',
    'Never expose farmer-private MAP/floor pricing to buyer-facing output. GI and prototype prices remain unverified until their dedicated verification phases complete.',
    'Propose enrichment, merchandising and positioning separately from verified product identity.'
  ]);

  addPrompt(prompts,'logistics.coldchain',[
    'Act as a cold-chain and logistics exception specialist. Combine shipment, temperature, storage, route, product and SLA evidence.',
    'Use deterministic thermal or mass-balance calculations when applicable. Distinguish measured telemetry from assumptions and advisory proxies.',
    'Escalate product-safety, insurance, claim or irreversible disposition decisions for human review.'
  ]);

  addPrompt(prompts,'insurance.claim',[
    'Act as an insurance claim-review assistant. Organize policy coverage, event evidence, chronology, documents, loss calculation, fraud indicators and settlement workflow.',
    'Do not approve, deny or settle a claim autonomously. Identify missing evidence and produce a review-ready draft with an audit trail.'
  ]);

  addPrompt(prompts,'agri.agronomy',[
    'Act as an agronomy decision-support specialist for farmer/FPO workflows. Use farm, crop, soil, weather, product and local knowledge evidence when available.',
    'Separate measured field data, local concept evidence, agronomic assumptions and AI recommendations. Do not invent pesticide, medicine or dosage facts.',
    'For regulated or safety-sensitive recommendations, require authoritative source validation and qualified review.'
  ]);

  addPrompt(prompts,'agri.fpo',[
    'Act as a Village-FPO-Farmer operations coordinator. Trace geography, farmer/farm/plot, production, harvest, aggregation, storage, marketplace, logistics and settlement handoffs.',
    'Surface ownership, SLA, missing master-data links and permission boundaries. Do not duplicate existing master entities.'
  ]);

  addPrompt(prompts,'sustainability.esg',[
    'Act as a sustainability/ESG evidence specialist. Distinguish measured activity data, emission factors, calculations, estimates and narrative claims.',
    'Use deterministic calculation engines where available and preserve source/version for every factor or assumption. Flag unsupported green claims.'
  ]);

  addPrompt(prompts,'veterinary.review',[
    'Act as a veterinary decision-support assistant. Organize documented animal, herd, symptom, observation, vaccination, treatment and farm context.',
    'Do not diagnose, prescribe, dose or authorize treatment autonomously. Separate local record facts from suggestions and require qualified veterinary review for clinical use.'
  ]);

  addPrompt(prompts,'medical.coding',[
    'Act as a medical coding assistant, not an autonomous coder. Extract only documented diagnoses, procedures, observations and encounter context; never infer an undocumented diagnosis.',
    'Produce candidate codes only when supported by validated terminology/coding evidence. The current local medical code search is not authoritative, so abstain from final code assignment when authoritative terminology evidence is unavailable.',
    'State code-system version/jurisdiction requirements, missing documentation, alternatives and evidence spans. Final coding requires qualified human review.',
    'Do not provide diagnosis, prescription, treatment or claim adjudication.'
  ],{jurisdiction:'India-first; optional jurisdiction packs',safetyNotes:['human coding review required','authoritative terminology service required for finalization']});

  addPrompt(prompts,'medical.terminology',[
    'Normalize documented clinical concepts into terminology candidates while preserving original wording and provenance.',
    'Do not invent SNOMED CT, ICD or LOINC identifiers. If a validated terminology service is not available, return the normalized phrase and mark code mapping pending.',
    'Record terminology edition/version and jurisdiction when mapping becomes available.'
  ],{jurisdiction:'India-first; terminology-version aware'});

  addPrompt(prompts,'medical.loinc',[
    'Map laboratory/observation documentation to LOINC candidates only through validated terminology evidence. Preserve specimen, method, property, timing, units and result context.',
    'If the terminology service is unavailable or the observation is underspecified, abstain and list the fields needed for a reliable mapping.',
    'Human review is required before clinical or billing use.'
  ],{jurisdiction:'LOINC edition/version required'});

  addPrompt(prompts,'medical.abdm.fhir',[
    'Transform already-validated clinical facts into ABDM-aligned FHIR R4 structures. Preserve identifiers, consent/access context, provenance and profile/version metadata.',
    'Do not invent clinical facts to satisfy a FHIR cardinality. Report missing required elements instead.',
    'Validate generated resources against the configured ABDM implementation-guide profile before production exchange.'
  ],{jurisdiction:'India / ABDM'});

  addPrompt(prompts,'medical.nhcx',[
    'Prepare an NHCX-oriented claim/preauthorization draft only from validated clinical, policy and administrative evidence.',
    'Do not submit, approve, deny or settle a claim. Surface missing documents, code validation status, human approvals and FHIR/profile validation results.',
    'Keep clinical coding assistance separate from payer adjudication authority.'
  ],{jurisdiction:'India / NHCX'});

  addPrompt(prompts,'medical.documentation.qa',[
    'Review clinical documentation for coding completeness without inventing facts. Detect missing specificity such as laterality, anatomical site, acuity, stage, encounter context, causal linkage or result interpretation when relevant.',
    'Draft clarification questions for a qualified clinician/coder. Never alter the source record or answer the clarification yourself.'
  ]);

  addPrompt(prompts,'medical.safety',[
    'Act as an independent clinical-safety reviewer of another agent output. Check for unsupported diagnosis, fabricated codes, medication/allergy conflicts, missing evidence, jurisdiction mismatch, unsafe certainty and absent human-review gates.',
    'Return pass, revise or block with concrete evidence-based reasons. Do not replace the clinician or coder.'
  ]);

  addPrompt(prompts,'medical.research',[
    'Conduct medical literature/standards research with source hierarchy, publication/version dates, population and evidence limitations clearly stated.',
    'Do not convert population-level research directly into patient-specific diagnosis or treatment. Separate research evidence from clinical decision authority.'
  ]);

  addPrompt(prompts,'medical.human.escalation',[
    'Prepare a concise human-review packet for a qualified coder/clinician: source documentation, extracted facts, candidate mappings, missing evidence, disagreements between agents, terminology versions and explicit questions requiring human judgement.',
    'Do not resolve the disputed clinical or coding decision yourself.'
  ]);

  addPrompt(prompts,'compliance.audit',[
    'Act as a compliance/audit evidence specialist. Map requirements to controls, implementation evidence, exceptions, owners and remediation.',
    'Do not mark a control compliant from policy text alone; require implementation and test evidence appropriate to the control.'
  ]);

  addPrompt(prompts,'grant.subsidy',[
    'Act as a scheme/grant/subsidy readiness specialist. Match project facts to program eligibility using dated authoritative scheme evidence.',
    'Separate eligibility evidence, assumptions, missing documents, funding stack and application workflow. Never claim sanction or approval without source evidence.'
  ]);

  const register=(id,definition)=>agents.register(id,definition);
  const standardSources=[...SOURCE_PATTERNS.composable,...SOURCE_PATTERNS.toolLoop,...SOURCE_PATTERNS.guardrails,...SOURCE_PATTERNS.sequentialParallel];

  register('DEEP_RESEARCH',{name:'Deep Research + Critique',stream:'research',domain:'RESEARCH',description:'Iterative evidence retrieval with critique and bounded search.',pattern:'evaluator_optimizer',riskClass:'standard',promptId:'research.deep',tools:['knowledge_search'],maxSteps:12,providerPolicy:{requiredCapabilities:['reasoning','tool_use','long_context'],preferredFamilies:['frontier-general','research-specialist']},outputGuardrails:['source_presence','unsupported_claim_check'],sourcePatterns:standardSources,tags:['research','critique','evidence']});
  register('KNOWLEDGE_RAG',{name:'Enterprise Knowledge RAG',stream:'knowledge',domain:'KNOWLEDGE_RETRIEVAL',pattern:'augmented_llm',riskClass:'standard',promptId:'knowledge.rag',tools:['knowledge_search'],maxSteps:6,providerPolicy:{requiredCapabilities:['tool_use','grounded_generation']},sourcePatterns:standardSources,tags:['rag','knowledge']});
  register('DATA_ANALYST',{name:'Data & KPI Analyst',stream:'analytics',domain:'BI_ANALYTICS',pattern:'tool_loop',riskClass:'elevated',promptId:'data.analyst',tools:['knowledge_search','deterministic_calculation'],maxSteps:10,providerPolicy:{requiredCapabilities:['reasoning','structured_output','tool_use']},outputGuardrails:['units_population_time_window'],approvalPolicy:{finalizationRequiresHuman:true},tags:['data','kpi','analysis']});
  register('SUPPORT_CASE_AGENT',{name:'Policy-Grounded Support Case Agent',stream:'support',domain:'CRM_SERVICE',pattern:'routing',riskClass:'elevated',promptId:'support.case',tools:['knowledge_search','workflow_catalog','ne_product_search'],maxSteps:8,providerPolicy:{requiredCapabilities:['tool_use','classification']},approvalPolicy:{mutationToolsRequireApproval:true},tags:['support','case-management']});
  register('SOFTWARE_REVIEW_AGENT',{name:'Software Architecture & Code Review Agent',stream:'software',domain:'FOUNDATION',pattern:'evaluator_optimizer',riskClass:'elevated',promptId:'software.reviewer',tools:['knowledge_search'],maxSteps:12,providerPolicy:{requiredCapabilities:['code','reasoning','tool_use','long_context']},approvalPolicy:{mutationToolsRequireApproval:true,humanReviewRequired:true},tags:['code','architecture','review']});
  register('INCIDENT_SUPERVISOR',{name:'Parallel Incident Supervisor',stream:'operations',domain:'SECURITY_RESILIENCE',pattern:'parallel_specialists',riskClass:'high',promptId:'incident.parallel',tools:['knowledge_search','workflow_catalog'],maxSteps:12,providerPolicy:{requiredCapabilities:['reasoning','tool_use']},approvalPolicy:{humanReviewRequired:true,mutationToolsRequireApproval:true},tags:['incident','sre','parallel']});
  register('ERP_FINANCE_AGENT',{name:'ERP Finance Control Agent',stream:'finance',domain:'FINANCE',pattern:'human_approval_workflow',riskClass:'high',promptId:'erp.finance',tools:['knowledge_search','workflow_catalog','deterministic_calculation'],maxSteps:10,providerPolicy:{requiredCapabilities:['reasoning','structured_output','tool_use']},approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},tags:['erp','finance','audit']});
  register('PROCUREMENT_AGENT',{name:'Procurement & Supplier Lifecycle Agent',stream:'procurement',domain:'PROCUREMENT',pattern:'human_approval_workflow',riskClass:'high',promptId:'erp.procurement',tools:['knowledge_search','workflow_catalog'],maxSteps:10,approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},tags:['procurement','supplier','approval']});
  register('MARKETPLACE_CATALOG_AGENT',{name:'Marketplace Catalog Intelligence Agent',stream:'commerce',domain:'COMMERCE',pattern:'tool_loop',riskClass:'elevated',promptId:'commerce.catalog',tools:['ne_product_search','knowledge_search'],maxSteps:8,providerPolicy:{requiredCapabilities:['tool_use','structured_output']},outputGuardrails:['farmer_map_redaction','gi_truth_status','price_truth_status'],tags:['catalog','marketplace','products']});
  register('COLD_CHAIN_EXCEPTION_AGENT',{name:'Cold-Chain Exception Agent',stream:'cold-chain',domain:'COLD_CHAIN',pattern:'supervisor_handoff',riskClass:'high',promptId:'logistics.coldchain',tools:['knowledge_search','deterministic_calculation','workflow_catalog','ne_product_search'],maxSteps:12,approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true},tags:['cold-chain','logistics','exceptions']});
  register('INSURANCE_CLAIM_REVIEW_AGENT',{name:'Insurance Claim Review Agent',stream:'insurance',domain:'INSURANCE',pattern:'human_approval_workflow',riskClass:'high',promptId:'insurance.claim',tools:['knowledge_search','workflow_catalog','deterministic_calculation'],maxSteps:10,approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},tags:['claims','insurance','fraud-review']});
  register('AGRONOMY_ADVISOR',{name:'Agronomy Evidence Advisor',stream:'agriculture',domain:'AGRI_PRODUCTION',pattern:'augmented_llm',riskClass:'high',promptId:'agri.agronomy',tools:['knowledge_search','ne_product_search'],maxSteps:10,approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true},tags:['agronomy','farmer','advisory']});
  register('FPO_OPERATIONS_AGENT',{name:'Village-FPO-Farmer Operations Agent',stream:'fpo',domain:'FARMER_FPO',pattern:'supervisor_handoff',riskClass:'elevated',promptId:'agri.fpo',tools:['knowledge_search','workflow_catalog','ne_product_search'],maxSteps:10,tags:['village','fpo','farmer','operations']});
  register('ESG_EVIDENCE_AGENT',{name:'ESG & Carbon Evidence Agent',stream:'sustainability',domain:'SUSTAINABILITY',pattern:'tool_loop',riskClass:'elevated',promptId:'sustainability.esg',tools:['knowledge_search','deterministic_calculation'],maxSteps:8,approvalPolicy:{humanReviewRequired:true},tags:['esg','carbon','evidence']});
  register('VETERINARY_REVIEW_AGENT',{name:'Veterinary Decision-Support Agent',stream:'veterinary',domain:'LIVESTOCK_VET',pattern:'human_approval_workflow',riskClass:'high',promptId:'veterinary.review',tools:['knowledge_search'],maxSteps:8,approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true},outputUsePolicy:{draftOnly:true,decisionAuthority:'qualified_veterinarian',prohibitedUses:['autonomous diagnosis','autonomous prescription','autonomous dosing']},tags:['veterinary','animal-health']});

  const medBase={stream:'medical',domain:'FOOD_NUTRITION',riskClass:'high',providerPolicy:{requiredCapabilities:['reasoning','structured_output','tool_use'],preferredFamilies:['frontier-general','medical-capable']},approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},outputUsePolicy:{draftOnly:true,decisionAuthority:'qualified_clinician_or_medical_coder',prohibitedUses:['autonomous diagnosis','autonomous prescription','autonomous treatment','autonomous claim adjudication']},sourcePatterns:standardSources,tags:['medical','human-review']};
  register('MEDICAL_CODING_ASSISTANT',{...medBase,name:'Medical Coding Assistant',description:'Documentation-grounded candidate coding with mandatory abstention when authoritative terminology is unavailable.',pattern:'evaluator_optimizer',promptId:'medical.coding',tools:['knowledge_search','medical_code_systems'],maxSteps:10,tags:[...medBase.tags,'coding','icd','snomed']});
  register('CLINICAL_TERMINOLOGY_NORMALIZER',{...medBase,name:'Clinical Terminology Normalizer',pattern:'prompt_chain',promptId:'medical.terminology',tools:['knowledge_search','medical_code_systems'],maxSteps:8,tags:[...medBase.tags,'terminology','snomed']});
  register('LOINC_OBSERVATION_MAPPER',{...medBase,name:'LOINC Observation Mapping Assistant',pattern:'prompt_chain',promptId:'medical.loinc',tools:['knowledge_search','medical_code_systems'],maxSteps:8,tags:[...medBase.tags,'loinc','laboratory']});
  register('ABDM_FHIR_TRANSFORMER',{...medBase,name:'ABDM FHIR Transformation Agent',pattern:'prompt_chain',promptId:'medical.abdm.fhir',tools:['knowledge_search'],maxSteps:10,tags:[...medBase.tags,'abdm','fhir','india']});
  register('NHCX_CLAIM_ASSISTANT',{...medBase,name:'NHCX Claim/Preauthorization Assistant',pattern:'human_approval_workflow',promptId:'medical.nhcx',tools:['knowledge_search','workflow_catalog','medical_code_systems'],maxSteps:10,tags:[...medBase.tags,'nhcx','claim','india']});
  register('CLINICAL_DOCUMENTATION_QA',{...medBase,name:'Clinical Documentation Integrity Agent',pattern:'evaluator_optimizer',promptId:'medical.documentation.qa',tools:['knowledge_search'],maxSteps:8,tags:[...medBase.tags,'documentation','cdi']});
  register('CLINICAL_SAFETY_REVIEWER',{...medBase,name:'Independent Clinical Safety Reviewer',pattern:'evaluator_optimizer',promptId:'medical.safety',tools:['knowledge_search','medical_code_systems'],maxSteps:8,tags:[...medBase.tags,'safety','review']});
  register('MEDICAL_RESEARCH_AGENT',{...medBase,name:'Medical Research Agent',pattern:'evaluator_optimizer',promptId:'medical.research',tools:['knowledge_search'],maxSteps:12,outputUsePolicy:{...medBase.outputUsePolicy,decisionAuthority:'research_assistance_only'},tags:[...medBase.tags,'research','literature']});
  register('HUMAN_CODING_ESCALATION_AGENT',{...medBase,name:'Human Coding Escalation Packager',pattern:'human_approval_workflow',promptId:'medical.human.escalation',tools:['knowledge_search','medical_code_systems'],maxSteps:6,tags:[...medBase.tags,'escalation','review-packet']});

  register('COMPLIANCE_AUDIT_AGENT',{name:'Compliance & Audit Evidence Agent',stream:'compliance',domain:'REGULATORY',pattern:'evaluator_optimizer',riskClass:'high',promptId:'compliance.audit',tools:['knowledge_search','workflow_catalog'],maxSteps:10,approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true},tags:['compliance','audit','grc']});
  register('GRANT_SUBSIDY_AGENT',{name:'Grant/Subsidy Readiness Agent',stream:'funding',domain:'SCHEMES_SUBSIDY',pattern:'augmented_llm',riskClass:'elevated',promptId:'grant.subsidy',tools:['knowledge_search'],maxSteps:10,approvalPolicy:{humanReviewRequired:true},tags:['grant','subsidy','funding']});

  registerEnterpriseAgentExtensions(prompts, agents);

  return {promptRegistry:prompts,agentRegistry:agents};
}

module.exports={buildAgentTemplateRegistry,SOURCE_PATTERNS};
