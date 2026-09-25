from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\core\erpIntelligenceCellRegistry.js")
t=p.read_text(encoding="utf-8")
t=t.replace("const optimisation = require('./ai/optimisation');","const optimisation = require('./ai/optimisation');\nconst erpOptimization = require('./erpOptimizationEngine');\nconst enterpriseBlueprint = require('./erpEnterpriseBlueprint');")

start=t.index("const BUSINESS_OPTIMIZATION_OBJECTIVES = Object.freeze({")
end=t.index("const ERP_LAYER_CONTRACT",start)
new_block="""const BUSINESS_OPTIMIZATION_OBJECTIVES = Object.freeze(
  Object.fromEntries(Object.entries(erpOptimization.OBJECTIVE_PROFILES).map(([domainId, profile]) => [
    domainId,
    [profile.id, ...(profile.specializedObjectives || [])],
  ]))
);

"""
t=t[:start]+new_block+t[end:]

old="""  const objectiveIds=BUSINESS_OPTIMIZATION_OBJECTIVES[domainId] || [];
  const executableObjectives=objectiveIds.filter((id)=>optimisation.OBJECTIVES.has(id));
  const serviceRefs=(DOMAIN_SERVICES[domainId]||[]).map((ref)=>({path:ref,exists:sourceExists(projectRoot,ref)}));
"""
new="""  const objectiveIds=BUSINESS_OPTIMIZATION_OBJECTIVES[domainId] || [];
  const domainObjective=erpOptimization.OBJECTIVE_PROFILES[domainId] || null;
  const specializedObjectiveIds=(domainObjective?.specializedObjectives||[]).filter((id)=>optimisation.OBJECTIVES.has(id));
  const executableObjectives=domainObjective ? [domainObjective.id, ...specializedObjectiveIds] : specializedObjectiveIds;
  const serviceRefs=(DOMAIN_SERVICES[domainId]||[]).map((ref)=>({path:ref,exists:sourceExists(projectRoot,ref)}));
  const detailedCapabilities=enterpriseBlueprint.listCapabilities(domainId);
"""
if old not in t: raise RuntimeError("objective setup block missing")
t=t.replace(old,new,1)

t=t.replace("    capabilities:[...domain.capabilities],","    capabilities:[...domain.capabilities],\n    detailedBlueprint:{capabilityEntries:detailedCapabilities.length,moduleGroups:[...new Set(detailedCapabilities.map((x)=>x.moduleGroup))],capabilities:detailedCapabilities},")

old2="""      businessOptimization:{
        engine:'backend/src/core/ai/optimisation.js',
        objectiveIds,
        executableObjectiveIds:executableObjectives,
        status:objectiveIds.length===0?'CONTRACT_DEFINED_OBJECTIVE_NOT_YET_IMPLEMENTED':
          executableObjectives.length===objectiveIds.length?'EXECUTABLE':'PARTIAL_EXECUTION',
        guarantee:'Optimization must report feasibility, achieved cost and limitations; no unproven optimality claim.',
      },
"""
new2="""      businessOptimization:{
        engine:'backend/src/core/erpOptimizationEngine.js',
        specializedEngine:'backend/src/core/ai/optimisation.js',
        objectiveIds,
        executableObjectiveIds:executableObjectives,
        status:domainObjective?'EXECUTABLE':'OBJECTIVE_NOT_IMPLEMENTED',
        guarantee:'Domain candidate optimization is exact only within the supplied feasible candidate set; specialized heuristic solvers report feasibility and never claim unproven global optimality.',
      },
"""
if old2 not in t: raise RuntimeError("businessOptimization block missing")
t=t.replace(old2,new2,1)

old3="""        runtimeCostController:'backend/src/core/ai/aiCostController.js',
        providerCostTruth:'LEGACY_STATIC_RATE_TABLE_REQUIRES_CURRENT_PROVIDER_PRICING_REFRESH',
        routingPolicy:[
"""
new3="""        businessCostService:'backend/src/core/erpCostOptimizationService.js',
        runtimeCostController:'backend/src/core/ai/aiCostController.js',
        providerCostTruth:'CURRENT_CONFIG_REQUIRED_FOR_EXTERNAL_COST_ROUTING',
        routingPolicy:[
"""
if old3 not in t: raise RuntimeError("costOptimization block missing")
t=t.replace(old3,new3,1)
t=t.replace("        status:'CONTRACT_DEFINED_EXISTING_CONTROLLER_REQUIRES_RATE_REFRESH',","        status:'EXECUTABLE_WITH_TRUTHFUL_UNKNOWN_EXTERNAL_COST',")

old4="""    executableBusinessOptimization:cells.filter((c)=>c.layers.businessOptimization.status==='EXECUTABLE').length,
    businessOptimizationObjectiveGaps:cells.filter((c)=>c.layers.businessOptimization.status==='CONTRACT_DEFINED_OBJECTIVE_NOT_YET_IMPLEMENTED').map((c)=>c.erpDomainId),
    serviceSourceGaps:cells.filter((c)=>!c.layers.transactionalCore.sourceServices.some((s)=>s.exists)).map((c)=>c.erpDomainId),
    costRateRefreshRequired:cells.filter((c)=>c.layers.costOptimization.providerCostTruth.includes('REQUIRES')).map((c)=>c.erpDomainId),
"""
new4="""    executableBusinessOptimization:cells.filter((c)=>c.layers.businessOptimization.status==='EXECUTABLE').length,
    businessOptimizationObjectiveGaps:cells.filter((c)=>c.layers.businessOptimization.status!=='EXECUTABLE').map((c)=>c.erpDomainId),
    serviceSourceGaps:cells.filter((c)=>!c.layers.transactionalCore.sourceServices.some((s)=>s.exists)).map((c)=>c.erpDomainId),
    detailedBlueprint:enterpriseBlueprint.summary(),
    costOptimizationCovered:cells.filter((c)=>c.layers.costOptimization.status.startsWith('EXECUTABLE')).length,
    externalCostPricingConfigurationRequired:cells.map((c)=>c.erpDomainId),
"""
if old4 not in t: raise RuntimeError("coverage block missing")
t=t.replace(old4,new4,1)

p.write_text(t,encoding="utf-8")
print("ERP intelligence cells upgraded to executable optimization and detailed blueprint")
