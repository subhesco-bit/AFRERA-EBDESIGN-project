const { AI_ENGINES, getEngineRuntimeStatus, listReadyEngines, findBestEngine } = require('../core/ai/aiEngineRegistry');
const { providerStatus } = require('../core/ai/aiProviderAdapters');
const { buildAICapabilityCatalog, summarize } = require('../core/ai/aiCapabilityCatalog');

describe('AI capability catalog governance', () => {
  const previous = {};
  beforeEach(() => {
    for (const key of ['ANTHROPIC_API_KEY','DEEPSEEK_API_KEY','XAI_API_KEY']) { previous[key]=process.env[key]; delete process.env[key]; }
  });
  afterEach(() => {
    for (const [key,value] of Object.entries(previous)) { if (value == null) delete process.env[key]; else process.env[key]=value; }
  });

  it('does not report declared LLM adapters as live engines', () => {
    expect(getEngineRuntimeStatus('llm_claude')).toEqual(expect.objectContaining({state:'not_configured',available:false,configured:false}));
    process.env.ANTHROPIC_API_KEY='configured-for-test';
    expect(getEngineRuntimeStatus('llm_claude')).toEqual(expect.objectContaining({state:'configured_adapter_not_live',available:false,configured:true}));
    expect(findBestEngine('text_generation',{requireAvailable:true})).toBeNull();
  });

  it('registers DeepSeek and Grok as known adapter metadata without fake readiness', () => {
    expect(AI_ENGINES.llm_deepseek.provider).toBe('deepseek');
    expect(AI_ENGINES.llm_grok.provider).toBe('grok');
    expect(providerStatus('deepseek').known).toBe(true);
    expect(providerStatus('grok').known).toBe(true);
    expect(getEngineRuntimeStatus('llm_deepseek').available).toBe(false);
    expect(getEngineRuntimeStatus('llm_grok').available).toBe(false);
  });

  it('reports verified local backing only for engines with real source files', () => {
    expect(getEngineRuntimeStatus('vision_quality')).toEqual(expect.objectContaining({state:'verified_local_backing',available:true}));
    expect(getEngineRuntimeStatus('vision_ocr')).toEqual(expect.objectContaining({state:'verified_local_backing',available:true}));
    expect(getEngineRuntimeStatus('recommendation')).toEqual(expect.objectContaining({state:'verified_local_backing',available:true}));
    expect(getEngineRuntimeStatus('classification')).toEqual(expect.objectContaining({state:'unmapped',available:false}));
    expect(listReadyEngines().every((engine)=>engine.runtime.available)).toBe(true);
  });

  it('quarantines legacy static accuracy claims as unverified metadata', () => {
    const catalog=buildAICapabilityCatalog();
    const claims=catalog.filter((row)=>row.accuracyClaim!=null);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims.every((row)=>row.accuracyClaimAuthority==='legacy-static-metadata-unverified')).toBe(true);
    expect(claims.every((row)=>row.autoExecutionEligible===false)).toBe(true);
  });

  it('includes the governed hybrid knowledge engine and a truthful summary', () => {
    const catalog=buildAICapabilityCatalog();
    expect(catalog.find((row)=>row.id==='knowledge:hybrid-retrieval')).toEqual(expect.objectContaining({autoExecutionEligible:true}));
    const stats=summarize(catalog);
    expect(stats.count).toBe(catalog.length);
    expect(stats.unverifiedAccuracyClaims).toBeGreaterThan(0);
  });
});
