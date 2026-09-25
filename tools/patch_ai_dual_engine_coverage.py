from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\core\ai\enterpriseDualBackboneCatalog.js')
t=p.read_text(encoding='utf-8')
t=t.replace("const { findBestEngine, getEnginesByCapability } = require('./aiEngineRegistry');","const { findBestEngine, getEnginesByCapability, getEngineRuntimeStatus } = require('./aiEngineRegistry');")
old="""function engineCandidates(profile) {
  const seen = new Map();
  for (const capability of profile.capabilities || []) {
    for (const engine of getEnginesByCapability(capability) || []) {
      if (!seen.has(engine.id)) seen.set(engine.id, engine);
    }
  }
  return [...seen.values()].map((engine) => ({
    id:engine.id,
    name:engine.name,
    type:engine.type,
    provider:engine.provider,
    capabilities:engine.capabilities || [],
  }));
}
"""
new="""function engineCandidates(profile) {
  const seen = new Map();
  const capabilityCoverage = {};
  for (const capability of profile.capabilities || []) {
    const engines = getEnginesByCapability(capability) || [];
    capabilityCoverage[capability] = {
      declared: engines.length,
      available: engines.filter((engine) => getEngineRuntimeStatus(engine).available).length,
      engineIds: engines.map((engine) => engine.id),
    };
    for (const engine of engines) if (!seen.has(engine.id)) seen.set(engine.id, engine);
  }
  return {
    candidates: [...seen.values()].map((engine) => ({
      id:engine.id,
      name:engine.name,
      type:engine.type,
      provider:engine.provider,
      capabilities:engine.capabilities || [],
      runtime:getEngineRuntimeStatus(engine),
    })),
    capabilityCoverage,
  };
}
"""
if old not in t: raise RuntimeError('engineCandidates block missing')
t=t.replace(old,new,1)
old2="""    const engines = engineCandidates(profile);
    return {
"""
new2="""    const engines = engineCandidates(profile);
    return {
"""
t=t.replace(old2,new2,1)
t=t.replace("        engineCandidates:engines,","        engineCandidates:engines.candidates,\n        engineCapabilityCoverage:engines.capabilityCoverage,")
old3="""  const embeddedRules = covered.filter((d)=>d.embeddedBackbone?.directRuleCoverage);
  const engineIntegrated = covered.filter((d)=>(d.embeddedBackbone?.requiredEngineCapabilities||[]).length>0);
  return {
"""
new3="""  const embeddedRules = covered.filter((d)=>d.embeddedBackbone?.directRuleCoverage);
  const declaredEngineCovered = covered.filter((d)=>Object.values(d.embeddedBackbone?.engineCapabilityCoverage||{}).every((x)=>x.declared>0));
  const executableEngineCovered = covered.filter((d)=>Object.values(d.embeddedBackbone?.engineCapabilityCoverage||{}).every((x)=>x.available>0));
  return {
"""
if old3 not in t: raise RuntimeError('coverage engine block missing')
t=t.replace(old3,new3,1)
t=t.replace("    engineIntegratedDomains:engineIntegrated.length,","    declaredEngineCoveredDomains:declaredEngineCovered.length,\n    currentlyExecutableEngineCoveredDomains:executableEngineCovered.length,")
t=t.replace("    embeddedDirectRuleGaps:covered.filter((d)=>!d.embeddedBackbone?.directRuleCoverage).map((d)=>d.domainCode),","    embeddedDirectRuleGaps:covered.filter((d)=>!d.embeddedBackbone?.directRuleCoverage).map((d)=>d.domainCode),\n    declaredEngineCoverageGaps:covered.filter((d)=>!declaredEngineCovered.includes(d)).map((d)=>d.domainCode),\n    currentRuntimeEngineGaps:covered.filter((d)=>!executableEngineCovered.includes(d)).map((d)=>d.domainCode),")
old4="""  const engine = findBestEngine(capability, options);
  return {selected:engine || null,reason:engine?'selected':'no_matching_engine',domainCode,capability};
"""
new4="""  const engine = findBestEngine(capability, { ...options, requireAvailable: options.requireAvailable !== false });
  return {selected:engine || null,reason:engine?'selected':'no_executable_engine',domainCode,capability};
"""
if old4 not in t: raise RuntimeError('selectEngine block missing')
t=t.replace(old4,new4,1)
p.write_text(t,encoding='utf-8')
print('dual-backbone engine coverage metrics corrected')