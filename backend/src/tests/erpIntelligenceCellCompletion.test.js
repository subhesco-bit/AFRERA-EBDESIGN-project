const { ERP_DOMAINS } = require('../services/erp/unifiedERPRegistry');
const cells = require('../core/erpIntelligenceCellRegistry');
const optimizer = require('../core/erpOptimizationEngine');
const cost = require('../core/erpCostOptimizationService');
const templates = require('../core/erpTemplateEvolutionService');
const completion = require('../core/erpCompletionRegistry');
const bridge = require('../modules/platform/ModuleAIERPBridge');

describe('ERP intelligence-cell enterprise backbone', () => {
  it('covers all 17 ERP domains with all eight mandatory layers', () => {
    const c = cells.coverage();
    expect(c.erpDomains).toBe(17);
    expect(c.completeLayerContracts).toBe(17);
    expect(c.agentTemplateCovered).toBe(17);
    expect(c.executableBusinessOptimization).toBe(17);
    expect(c.executableCostOptimization).toBe(17);
    expect(c.businessOptimizationObjectiveGaps).toEqual([]);
    expect(c.serviceSourceGaps).toEqual([]);
    expect(Object.keys(ERP_DOMAINS)).toHaveLength(17);
  });

  it('provides an executable deterministic optimization objective for every ERP domain', () => {
    const c = optimizer.coverage();
    expect(c.executableObjectiveDomains).toBe(17);
    expect(c.missingObjectiveDomains).toEqual([]);
    expect(c.objectives).toHaveLength(17);
  });

  it('selects only a feasible supplied candidate and reports baseline savings without claiming global optimality', () => {
    const result = optimizer.optimize('logistics', {
      baselineCandidateId: 'baseline',
      hardConstraints: [{ metric:'sla_attainment', operator:'>=', value:0.9 }],
      candidates: [
        { id:'baseline', metrics:{ freight_cost:100, fuel_cost:40, detention_cost:20, spoilage_cost:10, failed_delivery_cost:5, sla_attainment:0.94 } },
        { id:'better', metrics:{ freight_cost:90, fuel_cost:35, detention_cost:10, spoilage_cost:8, failed_delivery_cost:3, sla_attainment:0.96 } },
        { id:'cheap_bad_sla', metrics:{ freight_cost:50, fuel_cost:20, detention_cost:5, spoilage_cost:5, failed_delivery_cost:5, sla_attainment:0.7 } },
      ],
    });
    expect(result.feasible).toBe(true);
    expect(result.selected.id).toBe('better');
    expect(result.infeasibleCandidates.map(x=>x.id)).toContain('cheap_bad_sla');
    expect(result.savings.amount).toBeGreaterThan(0);
    expect(result.guarantee).toMatch(/supplied feasible candidates/i);
    expect(result.guarantee).toMatch(/not a proof of a global optimum/i);
  });

  it('never assumes missing business cost drivers are zero', () => {
    const result = cost.compareBusinessCost({
      drivers:['freight','fuel'],
      baseline:{freight:100},
      proposed:{freight:80,fuel:20},
    });
    expect(result.complete).toBe(false);
    expect(result.baselineTotal).toBeNull();
    expect(result.savings).toBeNull();
    expect(result.drivers.find(x=>x.driver==='fuel').status).toBe('MISSING_VALUE');
  });

  it('chooses the cheapest runtime option only after security, data, quality and SLA gates', () => {
    const result = cost.compareRuntimeOptions([
      {id:'cheap-insecure',costUsd:0.01,qualityScore:0.95,latencyMs:100,dataClass:'internal',securityAllowed:false},
      {id:'cheap-low-quality',costUsd:0.02,qualityScore:0.4,latencyMs:100,dataClass:'internal',securityAllowed:true},
      {id:'valid',costUsd:0.05,qualityScore:0.9,latencyMs:200,dataClass:'internal',securityAllowed:true},
    ], {minQuality:0.8,maxLatencyMs:500,allowedDataClasses:['internal']});
    expect(result.selected.id).toBe('valid');
    expect(result.rejected).toHaveLength(2);
  });

  it('keeps imported templates as source material until promotion gates pass', () => {
    const normalized = templates.normalizeTemplate({
      sourceType:'industry_standard',
      sourceRef:'test-reference',
      sourceLicense:'reference-only',
      erpDomainId:'finance',
      name:'Finance control template',
      capabilities:['general_ledger','accounts_payable'],
      controls:['segregation_of_duties'],
      optimizationClaims:['working_capital'],
      costClaims:['cost_center_variance'],
      aiClaims:['reconciliation_assistance'],
    });
    const contract = templates.integrationContract(normalized);
    expect(normalized.extractionStatus).toBe('EXTRACTED_NOT_PRODUCTION_AUTHORITY');
    expect(contract.status).toBe('READY_FOR_CONTROLLED_DEVELOPMENT');
    expect(contract.embedding.preserveSystemOfRecord).toBe(true);
    expect(contract.embedding.noDirectExternalMutation).toBe(true);
    expect(contract.promotionRule).toMatch(/No template becomes production authority/i);
  });

  it('embeds the intelligence cell and proposal-only optimization into the existing module bridge', () => {
    const result = bridge.attachAIERP('logistics', {}, {
      erp_domain:'logistics',
      erp_optimization:{
        candidates:[
          {id:'a',metrics:{freight_cost:100,fuel_cost:40,detention_cost:10,spoilage_cost:5,failed_delivery_cost:2,sla_attainment:0.95}},
          {id:'b',metrics:{freight_cost:90,fuel_cost:35,detention_cost:8,spoilage_cost:4,failed_delivery_cost:1,sla_attainment:0.96}},
        ],
      },
    });
    expect(result.erp.intelligence_cell.erpDomainId).toBe('logistics');
    expect(result.erp.optimization.status).toBe('evaluated');
    expect(result.erp.optimization_authority).toBe('PROPOSAL_ONLY_UNTIL_ERP_WORKFLOW_APPROVAL');
    expect(result.capabilities.erp_intelligence_cell).toBe(true);
    expect(result.capabilities.cost_optimization).toBe(true);
  });

  it('certifies the ERP backbone without pretending blueprint entries are implemented features', () => {
    const c = completion.build();
    expect(c.codeComplete).toBe(true);
    expect(c.codeBlockers).toEqual([]);
    expect(c.domains.canonicalERPDomains).toBe(17);
    expect(c.domains.executableBusinessOptimizationDomains).toBe(17);
    expect(c.domains.executableCostOptimizationDomains).toBe(17);
    expect(c.blueprint.capabilityEntries).toBeGreaterThan(500);
    expect(c.authority.systemOfRecord).toBe('transactional ERP core');
    expect(c.authority.optimization).toBe('proposal_only');
  });
});
