from pathlib import Path

root=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN')

# Add Grok/xAI to provider adapter metadata without pretending a live call exists.
p=root/'backend/src/core/ai/aiProviderAdapters.js'
t=p.read_text(encoding='utf-8')
if "grok: { primary: 'XAI_API_KEY' }" not in t:
    t=t.replace("  deepseek: { primary: 'DEEPSEEK_API_KEY' },", "  deepseek: { primary: 'DEEPSEEK_API_KEY' },\n  grok: { primary: 'XAI_API_KEY' },")
p.write_text(t,encoding='utf-8')

p=root/'backend/src/core/ai/aiEngineRegistry.js'
t=p.read_text(encoding='utf-8')
if "const { randomUUID } = require('crypto');" not in t:
    t=t.replace("const { logger } = require('../../utils/logger');", "const { logger } = require('../../utils/logger');\nconst { randomUUID } = require('crypto');\nconst fs = require('fs');\nconst path = require('path');\nconst { providerStatus } = require('./aiProviderAdapters');")

anchor="""  llm_gemini: {
    id: 'EBD-ENG-00000003',
    name: 'Google Gemini',
    type: 'llm',
    provider: 'gemini',
    status: 'ready',
    capabilities: ['text_generation', 'analysis', 'classification', 'summarization'],
    cost_per_1k_tokens: 0.001,
    max_tokens: 8192,
    confidence_threshold: 0.75,
  },"""
if "llm_deepseek:" not in t:
    extra=anchor+"""
  llm_deepseek: {
    id: 'EBD-ENG-00000010',
    name: 'DeepSeek LLM Adapter',
    type: 'llm',
    provider: 'deepseek',
    status: 'declared',
    capabilities: ['text_generation', 'analysis', 'classification', 'summarization'],
    cost_per_1k_tokens: null,
    max_tokens: null,
    confidence_threshold: 0.75,
  },
  llm_grok: {
    id: 'EBD-ENG-00000011',
    name: 'Grok/xAI LLM Adapter',
    type: 'llm',
    provider: 'grok',
    status: 'declared',
    capabilities: ['text_generation', 'analysis', 'classification', 'summarization'],
    cost_per_1k_tokens: null,
    max_tokens: null,
    confidence_threshold: 0.75,
  },"""
    if anchor not in t: raise RuntimeError('Gemini engine anchor missing')
    t=t.replace(anchor,extra,1)

marker='''/**\n * Get engine by ID\n */'''
if 'function getEngineRuntimeStatus' not in t:
    block="""const ENGINE_BACKING = {
  vision_quality: '../../services/visionService.js',
  vision_ocr: '../../services/ocrService.js',
  recommendation: '../../services/aiService/recommendationEngine.js',
};

function engineKey(engine) {
  const found = Object.entries(AI_ENGINES).find(([, value]) => value === engine || value.id === engine?.id);
  return found ? found[0] : null;
}

function getEngineRuntimeStatus(engineOrName) {
  const engine = typeof engineOrName === 'string' ? (AI_ENGINES[engineOrName] || getEngine(engineOrName)) : engineOrName;
  if (!engine) return { state: 'unknown', available: false, configured: false, mapped: false };
  const key = engineKey(engine);
  if (engine.type === 'llm') {
    const provider = providerStatus(engine.provider);
    return {
      state: provider.configured ? 'configured_adapter_not_live' : 'not_configured',
      available: false,
      configured: provider.configured,
      mapped: true,
      reason: 'Provider adapter metadata exists but live SDK/network execution is intentionally not implemented.',
    };
  }
  if (engine.type === 'speech') {
    const envName = engine.provider === 'google' ? 'GOOGLE_SPEECH_API_KEY' : engine.provider === 'azure' ? 'AZURE_SPEECH_KEY' : null;
    const configured = Boolean(envName && process.env[envName]);
    return { state: configured ? 'configured_adapter_not_live' : 'not_configured', available: false, configured, mapped: true, reason: 'Speech adapter has no live provider invocation yet.' };
  }
  if (key === 'classification') return { state: 'unmapped', available: false, configured: true, mapped: false, reason: 'No standalone classification backing exists; use an LLM capability when live or a deterministic classifier.' };
  const backing = ENGINE_BACKING[key];
  if (backing) {
    const backingPath = path.resolve(__dirname, backing);
    const exists = fs.existsSync(backingPath);
    return { state: exists ? 'verified_local_backing' : 'missing_backing', available: exists, configured: exists, mapped: exists, backing: path.relative(path.resolve(__dirname, '../..'), backingPath).replace(/\\\\/g, '/') };
  }
  return { state: engine.status || 'declared', available: false, configured: false, mapped: false, reason: 'No runtime backing classification recorded.' };
}

function getEngineRuntimeView(engineOrName) {
  const engine = typeof engineOrName === 'string' ? (AI_ENGINES[engineOrName] || getEngine(engineOrName)) : engineOrName;
  if (!engine) return null;
  return { ...engine, registryKey: engineKey(engine), runtime: getEngineRuntimeStatus(engine) };
}

"""
    if marker not in t: raise RuntimeError('get engine marker missing')
    t=t.replace(marker,block+marker,1)

old="""function listReadyEngines() {
  return Object.values(AI_ENGINES).filter(engine =>
    engine.status === 'ready' || engine.status === 'configured',
  );
}"""
new="""function listReadyEngines() {
  return Object.entries(AI_ENGINES)
    .map(([key, engine]) => ({ ...engine, registryKey: key, runtime: getEngineRuntimeStatus(engine) }))
    .filter(engine => engine.runtime.available);
}"""
if old not in t: raise RuntimeError('listReadyEngines block missing')
t=t.replace(old,new)

t=t.replace("const engineId = engineConfig.id || `EBD-ENG-${generateEngineId()}`;", "const engineId = engineConfig.id || `EBD-ENG-${generateEngineId()}`;")
t=t.replace("AI_ENGINES[engineConfig.name] = {", "const registryKey = engineConfig.key || String(engineConfig.name || engineId).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');\n  AI_ENGINES[registryKey] = {")
t=t.replace("function generateEngineId() {\n  return Date.now().toString(16).toUpperCase();\n}", "function generateEngineId() {\n  return randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();\n}")

t=t.replace("const { preferProvider, maxCost, minConfidence } = options;", "const { preferProvider, maxCost, minConfidence, requireAvailable = false } = options;")
needle="""  if (preferProvider) {
    candidates = candidates.filter(e => e.provider === preferProvider);
  }"""
replacement=needle+"""

  if (requireAvailable) {
    candidates = candidates.filter(e => getEngineRuntimeStatus(e).available);
  }"""
if replacement not in t:
    if needle not in t: raise RuntimeError('provider filter block missing')
    t=t.replace(needle,replacement,1)

oldcost="""  if (maxCost) {
    candidates = candidates.filter(e => e.cost_per_1k_tokens <= maxCost);
  }"""
newcost="""  if (maxCost != null) {
    candidates = candidates.filter(e => Number.isFinite(e.cost_per_1k_tokens) && e.cost_per_1k_tokens <= maxCost);
  }"""
if oldcost in t: t=t.replace(oldcost,newcost)
t=t.replace("  if (minConfidence) {", "  if (minConfidence != null) {")

export_anchor="""  listReadyEngines,
  registerEngine,
  findBestEngine,"""
export_new="""  listReadyEngines,
  getEngineRuntimeStatus,
  getEngineRuntimeView,
  registerEngine,
  findBestEngine,"""
if export_new not in t:
    if export_anchor not in t: raise RuntimeError('export anchor missing')
    t=t.replace(export_anchor,export_new,1)

p.write_text(t,encoding='utf-8')
print('phase42 AI registry governance patched')
