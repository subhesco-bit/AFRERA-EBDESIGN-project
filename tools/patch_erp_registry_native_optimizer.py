from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\core\erpIntelligenceCellRegistry.js')
t=p.read_text(encoding='utf-8')
t=t.replace("const optimisation = require('./ai/optimisation');","const erpOptimization = require('./erpOptimizationEngine');\nconst erpCostOptimization = require('./erpCostOptimizationService');")
t=t.replace("const objectiveIds=BUSINESS_OPTIMIZATION_OBJECTIVES[domainId] || [];\n  const executableObjectives=objectiveIds.filter((id)=>optimisation.OBJECTIVES.has(id));","const objectiveProfile=erpOptimization.OBJECTIVE_PROFILES[domainId] || null;\n  const objectiveIds=objectiveProfile?[objectiveProfile.id]:[];\n  const executableObjectives=objectiveProfile?[objectiveProfile.id]:[];")
old="""      businessOptimization:{
        engine:'backend/src/core/ai/optimisation.js',
        objectiveIds,
        executableObjectiveIds:executableObjectives,
        status:objectiveIds.length===0?'CONTRACT_DEFINED_OBJECTIVE_NOT_YET_IMPLEMENTED':
          executableObjectives.length===objectiveIds.length?'EXECUTABLE':'PARTIAL_EXECUTION',
        guarantee:'Optimization must report feasibility, achieved cost and limitations; no unproven optimality claim.',
      },"""
new="""      businessOptimization:{
        engine:'backend/src/core/erpOptimizationEngine.js',
        objectiveIds,
        executableObjectiveIds:executableObjectives,
        profile:objectiveProfile?{description:objectiveProfile.description,metrics:objectiveProfile.metrics,monetaryMetrics:objectiveProfile.monetary,specializedObjectives:objectiveProfile.specializedObjectives||[]}:null,
        status:objectiveProfile?'EXECUTABLE':'OBJECTIVE_GAP',
        guarantee:'Exact ranking among supplied feasible candidates under the declared objective; no unproven global optimality claim.',
      },"""
if old not in t: raise RuntimeError('business optimization block missing')
t=t.replace(old,new,1)
old2="""        runtimeCostController:'backend/src/core/ai/aiCostController.js',
        providerCostTruth:'LEGACY_STATIC_RATE_TABLE_REQUIRES_CURRENT_PROVIDER_PRICING_REFRESH',"""
new2="""        engine:'backend/src/core/erpCostOptimizationService.js',
        runtimeCostController:'backend/src/core/ai/aiCostController.js',
        providerCostTruth:'CURRENT_CONFIG_REQUIRED_FOR_EXTERNAL_PROVIDER_COST_ROUTING',"""
if old2 not in t: raise RuntimeError('cost block missing')
t=t.replace(old2,new2,1)
t=t.replace("status:'CONTRACT_DEFINED_EXISTING_CONTROLLER_REQUIRES_RATE_REFRESH',","status:'EXECUTABLE_WITH_EXPLICIT_COST_INPUTS',")
old3="""    executableBusinessOptimization:cells.filter((c)=>c.layers.businessOptimization.status==='EXECUTABLE').length,
    businessOptimizationObjectiveGaps:cells.filter((c)=>c.layers.businessOptimization.status==='CONTRACT_DEFINED_OBJECTIVE_NOT_YET_IMPLEMENTED').map((c)=>c.erpDomainId),"""
new3="""    executableBusinessOptimization:cells.filter((c)=>c.layers.businessOptimization.status==='EXECUTABLE').length,
    businessOptimizationObjectiveGaps:cells.filter((c)=>c.layers.businessOptimization.status!=='EXECUTABLE').map((c)=>c.erpDomainId),
    executableCostOptimization:cells.filter((c)=>c.layers.costOptimization.status==='EXECUTABLE_WITH_EXPLICIT_COST_INPUTS').length,"""
if old3 not in t: raise RuntimeError('coverage block missing')
t=t.replace(old3,new3,1)
p.write_text(t,encoding='utf-8')
print('ERP cell registry switched to 17-domain optimizer and cost engine')