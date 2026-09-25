'use strict';

const fs = require('fs');
const path = require('path');
const { ERP_DOMAINS } = require('../services/erp/unifiedERPRegistry');
const cells = require('./erpIntelligenceCellRegistry');
const optimizer = require('./erpOptimizationEngine');
const blueprint = require('./erpEnterpriseBlueprint');
const templates = require('./erpTemplateEvolutionService');

const REQUIRED_FILES = Object.freeze({
  unifiedRegistry:'backend/src/services/erp/unifiedERPRegistry.js',
  controlPlane:'backend/src/services/erpControlPlaneService.js',
  moduleBridge:'backend/src/modules/platform/ModuleAIERPBridge.js',
  intelligenceCells:'backend/src/core/erpIntelligenceCellRegistry.js',
  optimization:'backend/src/core/erpOptimizationEngine.js',
  costOptimization:'backend/src/core/erpCostOptimizationService.js',
  templateEvolution:'backend/src/core/erpTemplateEvolutionService.js',
  blueprint:'backend/src/core/erpEnterpriseBlueprint.js',
  aiIsolation:'backend/src/core/ai/aiIsolationTransformer.js',
  dualBackbone:'backend/src/core/ai/dualBackboneOrchestrator.js',
  outcomeLearning:'backend/src/core/outcomeResolver.js',
});

function fileState(root, relative){
  const p=path.resolve(root,relative);
  return {path:relative,exists:fs.existsSync(p),bytes:fs.existsSync(p)?fs.statSync(p).size:null};
}

function build(options={}){
  const root=options.projectRoot||path.resolve(__dirname,'../../..');
  const cellCoverage=cells.coverage({projectRoot:root});
  const optimizationCoverage=optimizer.coverage();
  const blueprintSummary=blueprint.summary();
  const cellRows=cells.listCells({projectRoot:root});
  const requiredFiles=Object.fromEntries(Object.entries(REQUIRED_FILES).map(([k,v])=>[k,fileState(root,v)]));
  const fileGaps=Object.entries(requiredFiles).filter(([,v])=>!v.exists).map(([k])=>k);
  const layerGaps=cellRows.flatMap((cell)=>{
    const missing=[];
    if(!cell.layers.transactionalCore)missing.push('transactional_core');
    if(!cell.layers.embeddedIntelligence)missing.push('embedded_intelligence');
    if(cell.layers.businessOptimization?.status!=='EXECUTABLE')missing.push('business_optimization');
    if(cell.layers.costOptimization?.status!=='EXECUTABLE_WITH_EXPLICIT_COST_INPUTS')missing.push('cost_optimization');
    if(cell.layers.isolatedAgentStepUp?.status!=='TEMPLATE_BOUND')missing.push('isolated_agent_step_up');
    if(!cell.layers.governanceAndApproval)missing.push('governance_and_approval');
    if(!cell.layers.observabilityAndAudit)missing.push('observability_and_audit');
    if(!cell.layers.outcomeLearning)missing.push('outcome_learning');
    return missing.map((layer)=>({domainId:cell.erpDomainId,layer}));
  });

  const codeBlockers=[
    ...fileGaps.map((x)=>'missing_file:'+x),
    ...cellCoverage.businessOptimizationObjectiveGaps.map((x)=>'optimization_gap:'+x),
    ...cellCoverage.serviceSourceGaps.map((x)=>'transaction_source_gap:'+x),
    ...layerGaps.map((x)=>'layer_gap:'+x.domainId+':'+x.layer),
  ];

  return {
    architecture:'erp-intelligence-cell-enterprise-backbone',
    codeComplete:codeBlockers.length===0,
    codeBlockers,
    domains:{
      canonicalERPDomains:Object.keys(ERP_DOMAINS).length,
      intelligenceCellDomains:cellCoverage.erpDomains,
      completeEightLayerContracts:cellCoverage.completeLayerContracts,
      agentTemplateCoveredDomains:cellCoverage.agentTemplateCovered,
      executableBusinessOptimizationDomains:cellCoverage.executableBusinessOptimization,
      executableCostOptimizationDomains:cellCoverage.executableCostOptimization,
      serviceSourceGaps:cellCoverage.serviceSourceGaps,
    },
    blueprint:blueprintSummary,
    optimization:{
      executableObjectiveDomains:optimizationCoverage.executableObjectiveDomains,
      missingObjectiveDomains:optimizationCoverage.missingObjectiveDomains,
      objectiveIds:optimizationCoverage.objectives.map((x)=>x.id),
      truthRule:'Optimization ranks only supplied feasible candidates under declared metrics/constraints and never claims an unproven global optimum.',
    },
    costOptimization:{
      domainsWithDeclaredDrivers:cellRows.filter((c)=>(c.layers.costOptimization.businessCostDrivers||[]).length>0).length,
      truthRule:'Missing business cost inputs are never assumed to be zero; external AI provider cost is routable only with configured current pricing.',
    },
    templateEvolution:{
      sourceTypes:[...templates.SOURCE_TYPES],
      stages:[...templates.STAGES],
      productionAuthority:'NONE_UNTIL_PROMOTION_GATES_PASS',
    },
    authority:{
      systemOfRecord:'transactional ERP core',
      optimization:'proposal_only',
      externalAI:'proposal_only',
      mutations:'ERP_WORKFLOW_AND_APPROVAL_ONLY',
      accounting:'deterministic_ledger_and_tax_rules_remain_authoritative',
    },
    requiredFiles,
    generatedAt:new Date().toISOString(),
  };
}

module.exports={REQUIRED_FILES,build};
