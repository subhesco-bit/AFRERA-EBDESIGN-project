'use strict';

function registerEnterpriseAgentExtensions(promptRegistry, agentRegistry) {
  const addPrompt = (id, instructions, extra = {}) => promptRegistry.register(id, {
    name: extra.name || id,
    instructions: Array.isArray(instructions) ? instructions.join('\n') : instructions,
    variables: extra.variables || [],
    outputContract: extra.outputContract || {},
    evidencePolicy: extra.evidencePolicy || 'cite_tool_or_source_evidence',
    jurisdiction: extra.jurisdiction || null,
    safetyNotes: extra.safetyNotes || [],
    sourcePatterns: extra.sourcePatterns || [],
  });

  const register = (id, definition) => agentRegistry.register(id, definition);

  const shared = {
    providerPolicy: {
      mode: 'capability_routed',
      requiredCapabilities: ['reasoning', 'structured_output', 'tool_use'],
      preferredFamilies: ['frontier-general', 'enterprise-specialist'],
      allowGateway: true,
      allowLocal: true,
    },
    memoryPolicy: 'task_scoped',
  };

  addPrompt('identity.governance', [
    'Act as an identity, access, role-governance and segregation-of-duties specialist.',
    'Evaluate identities, roles, entitlements, privileged access, approval chains and policy evidence.',
    'Never grant, revoke or escalate privilege without an explicitly approved mutation path. Surface excessive privilege, toxic role combinations and orphaned access.',
  ]);
  register('IDENTITY_GOVERNANCE_AGENT', {
    ...shared, name:'Identity & Access Governance Agent', stream:'identity-governance', domain:'IDENTITY_GOVERNANCE',
    pattern:'human_approval_workflow', riskClass:'high', promptId:'identity.governance',
    tools:['knowledge_search','workflow_catalog'], maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['iam','rbac','sod','privileged-access'],
  });

  addPrompt('hcm.workforce', [
    'Act as a human-capital and workforce operations specialist covering employee lifecycle, attendance, payroll inputs, leave, skills, training, performance and workforce planning.',
    'Separate recorded HR facts from recommendations. Do not make autonomous hiring, firing, disciplinary, compensation or sensitive personnel decisions.',
    'Respect role-based access and personal-data minimization.',
  ]);
  register('HCM_WORKFORCE_AGENT', {
    ...shared, name:'HCM & Workforce Agent', stream:'hcm', domain:'HCM', pattern:'human_approval_workflow', riskClass:'high',
    promptId:'hcm.workforce', tools:['knowledge_search','workflow_catalog','deterministic_calculation'], maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['hr','payroll','workforce','skills'],
  });

  addPrompt('inventory.wms', [
    'Act as an inventory and warehouse specialist covering stock integrity, lot/batch/serial traceability, reorder, safety stock, putaway, picking, packing, dispatch, bins, pallets, cold storage and cycle counting.',
    'Use deterministic inventory calculations where possible and surface data-quality or count discrepancies rather than smoothing them away.',
    'Do not release quarantined or quality-held stock autonomously.',
  ]);
  register('INVENTORY_WMS_AGENT', {
    ...shared, name:'Inventory & WMS Agent', stream:'inventory-wms', domain:'INVENTORY_WMS', pattern:'tool_loop', riskClass:'elevated',
    promptId:'inventory.wms', tools:['knowledge_search','workflow_catalog','deterministic_calculation'], maxSteps:10,
    tags:['inventory','warehouse','wms','traceability'],
  });

  addPrompt('scm.controltower', [
    'Act as a supply-chain control-tower specialist covering demand, supply, S&OP, material planning, capacity, distribution, supplier collaboration, shortages and fulfillment exceptions.',
    'Distinguish observed demand/supply from forecasts and scenarios. Preserve source dates, uncertainty and hard constraints.',
    'Do not convert a forecast into a purchase, allocation or shipment commitment without an approved workflow.',
  ]);
  register('SCM_CONTROL_TOWER_AGENT', {
    ...shared, name:'SCM Control-Tower Agent', stream:'scm', domain:'SCM', pattern:'supervisor_handoff', riskClass:'elevated',
    promptId:'scm.controltower', tools:['knowledge_search','workflow_catalog','deterministic_calculation'], maxSteps:12,
    approvalPolicy:{humanReviewRequired:true,mutationToolsRequireApproval:true},
    tags:['scm','sop','mrp','distribution','planning'],
  });

  addPrompt('manufacturing.production', [
    'Act as a manufacturing and fabrication specialist covering BOM, routing, work orders, scheduling, capacity, WIP, shop-floor execution, labor, machine state and production losses.',
    'Use deterministic production and OEE calculations when available. Separate plan, actual and forecast values.',
    'Do not change a released production order, engineering baseline or safety-critical process parameter without governed approval.',
  ]);
  register('MANUFACTURING_PRODUCTION_AGENT', {
    ...shared, name:'Manufacturing & Production Agent', stream:'manufacturing', domain:'MANUFACTURING', pattern:'tool_loop', riskClass:'elevated',
    promptId:'manufacturing.production', tools:['knowledge_search','workflow_catalog','deterministic_calculation'], maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,mutationToolsRequireApproval:true},
    tags:['manufacturing','bom','routing','oee','shop-floor'],
  });

  addPrompt('quality.ehs', [
    'Act as a quality, EHS and operational compliance specialist covering inspection, NCR, CAPA, root-cause analysis, audit, food/product safety, environmental and worker-safety controls.',
    'A failed or missing quality/safety gate is a blocker, not a suggestion. Preserve measurements, limits, methods, lab references and responsible approvers.',
    'Never release held product or close a safety incident autonomously.',
  ]);
  register('QUALITY_EHS_AGENT', {
    ...shared, name:'Quality & EHS Agent', stream:'quality-ehs', domain:'QUALITY_EHS', pattern:'human_approval_workflow', riskClass:'high',
    promptId:'quality.ehs', tools:['knowledge_search','workflow_catalog'], maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['quality','ehs','capa','ncr','safety'],
  });

  addPrompt('asset.eam', [
    'Act as an enterprise asset and maintenance specialist covering asset lifecycle, preventive/predictive maintenance, breakdowns, calibration, spares, reliability and equipment history.',
    'Use actual telemetry/work-order history where available and separate predictive indicators from confirmed failure.',
    'Safety-critical maintenance deferrals, overrides and returns-to-service require named human approval.',
  ]);
  register('ASSET_EAM_AGENT', {
    ...shared, name:'Enterprise Asset & Maintenance Agent', stream:'asset-eam', domain:'ASSET_EAM', pattern:'tool_loop', riskClass:'elevated',
    promptId:'asset.eam', tools:['knowledge_search','workflow_catalog','deterministic_calculation'], maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,mutationToolsRequireApproval:true},
    tags:['eam','maintenance','reliability','calibration'],
  });

  addPrompt('retail.store', [
    'Act as a retail and store-operations specialist covering POS, store inventory, assortment, promotion, shelf, footfall, franchise, loyalty and omnichannel handoffs.',
    'Separate observed sales from forecasts and ensure promotion/pricing recommendations respect margin, fairness and inventory constraints.',
    'Do not publish a price, promotion or customer-specific offer without the applicable approval policy.',
  ]);
  register('RETAIL_STORE_AGENT', {
    ...shared, name:'Retail & Store Operations Agent', stream:'retail', domain:'RETAIL', pattern:'tool_loop', riskClass:'elevated',
    promptId:'retail.store', tools:['knowledge_search','workflow_catalog','deterministic_calculation'], maxSteps:10,
    tags:['retail','pos','assortment','promotion','loyalty'],
  });

  addPrompt('logistics.tms', [
    'Act as a transport, fleet and logistics specialist covering shipment planning, carrier selection, route, load, freight, GPS, geofencing, driver/fleet state, POD and last-mile exceptions.',
    'Use measured telemetry and deterministic routing/cost calculations when available. Distinguish planned ETA from observed progress.',
    'Safety, carrier, customs, insurance and irreversible disposition decisions require governed human approval.',
  ]);
  register('LOGISTICS_TMS_AGENT', {
    ...shared, name:'Logistics & TMS Agent', stream:'logistics', domain:'LOGISTICS', pattern:'supervisor_handoff', riskClass:'elevated',
    promptId:'logistics.tms', tools:['knowledge_search','workflow_catalog','deterministic_calculation'], maxSteps:12,
    approvalPolicy:{humanReviewRequired:true,mutationToolsRequireApproval:true},
    tags:['logistics','tms','fleet','route','pod'],
  });

  addPrompt('project.epc', [
    'Act as a project/EPC/construction-control specialist covering WBS, schedule, BOQ, resources, cost, contractor billing, site progress, RFI, material reconciliation and change control.',
    'Separate baseline, approved change and actual progress. Use deterministic earned-value/cost calculations where available.',
    'Do not approve variation, contractor bill, schedule baseline or commercial commitment autonomously.',
  ]);
  register('PROJECT_EPC_AGENT', {
    ...shared, name:'Project & EPC Controls Agent', stream:'project-epc', domain:'PROJECT_EPC', pattern:'human_approval_workflow', riskClass:'high',
    promptId:'project.epc', tools:['knowledge_search','workflow_catalog','deterministic_calculation'], maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['project','epc','wbs','boq','rfi'],
  });

  addPrompt('ai.governance', [
    'Act as the AI governance and model-operations specialist for the enterprise AI estate.',
    'Track model/provider/template/tool versions, evaluations, drift, cost, confidence, guardrails, approvals, audit and runtime availability.',
    'Never claim a model or provider is live from metadata alone. Distinguish declared, configured, reachable, validated and production-approved states.',
  ]);
  register('AI_GOVERNANCE_AGENT', {
    ...shared, name:'AI Governance & ModelOps Agent', stream:'ai-intelligence', domain:'AI_INTELLIGENCE', pattern:'evaluator_optimizer', riskClass:'high',
    promptId:'ai.governance', tools:['knowledge_search','workflow_catalog'], maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,mutationToolsRequireApproval:true},
    tags:['ai-governance','modelops','evaluation','guardrails'],
  });

  addPrompt('mobile.edge', [
    'Act as a mobile/PWA/APK/desktop/edge architecture specialist covering offline-first behavior, synchronization, device capability, notifications, background work, secure storage, release compatibility and low-connectivity operation.',
    'Treat offline and sync conflict behavior as first-class requirements. Separate device-local facts from cloud state and preserve conflict provenance.',
    'Do not silently overwrite server or device data during reconciliation.',
  ]);
  register('MOBILE_EDGE_AGENT', {
    ...shared, name:'Mobile, APK, PWA & Edge Agent', stream:'mobile-edge', domain:'MOBILE_EDGE', pattern:'evaluator_optimizer', riskClass:'elevated',
    promptId:'mobile.edge', tools:['knowledge_search','workflow_catalog'], maxSteps:10,
    tags:['mobile','apk','pwa','desktop','offline'],
  });

  addPrompt('iot.telemetry', [
    'Act as an IoT, tracking and telemetry specialist covering sensors, device identity, calibration, connectivity, timestamps, geospatial data, telemetry quality, alerts and command safety.',
    'Never treat missing telemetry as a normal reading. Preserve sensor identity, unit, calibration state, event time and ingestion time.',
    'Device commands or control actions require the configured authority and safety gate.',
  ]);
  register('IOT_TELEMETRY_AGENT', {
    ...shared, name:'IoT & Telemetry Agent', stream:'iot-telemetry', domain:'IOT_TELEMETRY', pattern:'tool_loop', riskClass:'high',
    promptId:'iot.telemetry', tools:['knowledge_search','workflow_catalog','deterministic_calculation'], maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,mutationToolsRequireApproval:true},
    tags:['iot','telemetry','gps','sensor','tracking'],
  });

  addPrompt('processing.valueadd', [
    'Act as a processing, value-add and packaging specialist covering process routes, yields, loss, recipes/BOM, capacity, packaging, shelf-life, hygiene, batch traceability and value-add economics.',
    'Use deterministic mass-balance, yield and costing calculations. Separate pilot/prototype recipes from validated production specifications.',
    'Food-safety, allergen, lab, release and label claims require authoritative evidence and human approval.',
  ]);
  register('PROCESSING_VALUE_ADD_AGENT', {
    ...shared, name:'Processing, Value-Add & Packaging Agent', stream:'processing', domain:'PROCESSING', pattern:'tool_loop', riskClass:'high',
    promptId:'processing.valueadd', tools:['knowledge_search','workflow_catalog','deterministic_calculation'], maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['processing','packaging','yield','shelf-life'],
  });

  addPrompt('document.dms', [
    'Act as a document, records, OCR and knowledge-asset specialist covering ingestion, classification, metadata, version, retention, extraction, signatures and controlled records.',
    'Preserve original bytes/hash and distinguish OCR/extraction from source text. Never rewrite an authoritative record during interpretation.',
    'Sensitive or regulated documents must respect access, retention and disclosure policy.',
  ]);
  register('DOCUMENT_DMS_AGENT', {
    ...shared, name:'Document, OCR & Records Agent', stream:'document-dms', domain:'DOCUMENT_DMS', pattern:'tool_loop', riskClass:'elevated',
    promptId:'document.dms', tools:['knowledge_search','workflow_catalog'], maxSteps:10,
    tags:['dms','ocr','records','version-control'],
  });

  addPrompt('plm.engineering', [
    'Act as a PLM, engineering, CAD/BIM and digital-thread specialist covering requirement, design baseline, BOM, revision, configuration, change, verification and release.',
    'Preserve design authority, revision lineage and requirement-to-test traceability. Generated engineering suggestions are drafts until reviewed by qualified engineers where applicable.',
    'Do not release a drawing, BOM, design change or safety-critical configuration autonomously.',
  ]);
  register('PLM_ENGINEERING_AGENT', {
    ...shared, name:'PLM & Engineering Digital-Thread Agent', stream:'plm-engineering', domain:'PLM_ENGINEERING', pattern:'evaluator_optimizer', riskClass:'high',
    promptId:'plm.engineering', tools:['knowledge_search','workflow_catalog','deterministic_calculation'], maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['plm','cad','bim','engineering','digital-thread'],
  });

  addPrompt('payments.credit', [
    'Act as a payments, banking, credit and settlement assistant covering payment state, escrow, reconciliation, credit exposure, collections, disbursement and settlement evidence.',
    'Use deterministic financial calculations and source transaction records. Separate eligibility/risk assistance from final lending or payment authority.',
    'Never release payment, change credit terms, approve/deny credit or alter settlement records autonomously.',
  ]);
  register('PAYMENTS_CREDIT_AGENT', {
    ...shared, name:'Payments, Credit & Settlement Agent', stream:'payments-credit', domain:'PAYMENTS_CREDIT', pattern:'human_approval_workflow', riskClass:'high',
    promptId:'payments.credit', tools:['knowledge_search','workflow_catalog','deterministic_calculation'], maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['payments','credit','banking','settlement','escrow'],
  });

  addPrompt('traceability.gi', [
    'Act as a traceability, GI, provenance and trust specialist covering product identity, lot/batch chain-of-custody, certifications, origin claims, GI register evidence, custody events and trust exceptions.',
    'Do not infer certification or geographical indication status from product naming alone. Preserve official-source dates, identifiers, conflicts and derivative-vs-direct distinctions.',
    'Any missing chain-of-custody link remains a gap, not a presumed event.',
  ]);
  register('TRACEABILITY_GI_AGENT', {
    ...shared, name:'Traceability, GI & Provenance Agent', stream:'traceability-gi', domain:'TRACEABILITY_GI', pattern:'evaluator_optimizer', riskClass:'elevated',
    promptId:'traceability.gi', tools:['knowledge_search','workflow_catalog','ne_product_search'], maxSteps:10,
    tags:['traceability','gi','provenance','trust'],
  });

  addPrompt('accounting.close', [
    'Act as an accounting close-review specialist. Evaluate trial-balance balance, bank/tax/subledger/intercompany reconciliation, open draft journals and high-risk exceptions.',
    'Do not close or reopen a fiscal period. Produce a close-readiness proposal with evidence and blocking controls for an authorized finance approver.',
  ]);
  register('ACCOUNTING_CLOSE_AGENT', {
    ...shared,name:'Accounting Close Review Agent',stream:'finance',domain:'FINANCE',pattern:'human_approval_workflow',riskClass:'high',
    promptId:'accounting.close',tools:['knowledge_search','workflow_catalog','deterministic_calculation'],maxSteps:8,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['accounting','period-close','reconciliation'],
  });

  addPrompt('accounting.gst.reconcile', [
    'Act as a GST reconciliation assistant. Compare source invoices, recorded tax transactions, ITC/2B evidence and filing-period records using only validated evidence.',
    'Do not invent GST rates, HSN/SAC classifications, ITC eligibility or filing status. Statutory calculations require an effective-dated verified rule.',
    'Output exceptions and clarification items; do not file, accept ITC or alter tax ledgers autonomously.',
  ]);
  register('GST_RECONCILIATION_AGENT', {
    ...shared,name:'GST Reconciliation Agent',stream:'finance',domain:'FINANCE',pattern:'evaluator_optimizer',riskClass:'high',
    promptId:'accounting.gst.reconcile',tools:['knowledge_search','workflow_catalog','deterministic_calculation'],maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['gst','itc','reconciliation','tax'],
  });

  addPrompt('accounting.treasury', [
    'Act as a treasury and working-capital assistant. Use recorded cash, receivable, payable, inventory and settlement evidence plus deterministic metrics.',
    'Separate actual cash flow from forecast scenarios. Never release payment, alter credit limits, borrow funds or move cash autonomously.',
  ]);
  register('TREASURY_WORKING_CAPITAL_AGENT', {
    ...shared,name:'Treasury & Working Capital Agent',stream:'finance',domain:'FINANCE',pattern:'tool_loop',riskClass:'high',
    promptId:'accounting.treasury',tools:['knowledge_search','workflow_catalog','deterministic_calculation'],maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['treasury','working-capital','cash-flow'],
  });

  return {promptRegistry, agentRegistry};
}

module.exports = { registerEnterpriseAgentExtensions };
