const registry=require('../core/ai/aiEngineRegistry');
const { dispatch }=require('../core/ai/aiEngineDispatcher');
const confidence=require('../core/ai/aiConfidenceEngine');
const cost=require('../core/ai/aiCostController');
const completion=require('../core/ai/aiCompletionRegistry');
const dual=require('../core/ai/enterpriseDualBackboneCatalog');
const { buildAgentTemplateRegistry }=require('../core/ai/agentTemplateCatalog');

describe('AI engine fabric completion', () => {
  const oldGateway=process.env.AI_GATEWAY_API_KEY;
  const oldOidc=process.env.VERCEL_OIDC_TOKEN;
  const oldModel=process.env.AI_AGENT_DEFAULT_MODEL;
  beforeEach(()=>{
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.AI_AGENT_DEFAULT_MODEL;
    delete process.env.AI_GATEWAY_DEFAULT_MODEL;
  });
  afterAll(()=>{
    if(oldGateway==null) delete process.env.AI_GATEWAY_API_KEY; else process.env.AI_GATEWAY_API_KEY=oldGateway;
    if(oldOidc==null) delete process.env.VERCEL_OIDC_TOKEN; else process.env.VERCEL_OIDC_TOKEN=oldOidc;
    if(oldModel==null) delete process.env.AI_AGENT_DEFAULT_MODEL; else process.env.AI_AGENT_DEFAULT_MODEL=oldModel;
  });

  it('registers real local engines for specialist capabilities', () => {
    expect(registry.findBestEngine('forecasting',{requireAvailable:true})?.name).toMatch(/Forecasting/);
    expect(registry.findBestEngine('optimization',{requireAvailable:true})).not.toBeNull();
    expect(registry.findBestEngine('anomaly_detection',{requireAvailable:true})?.name).toMatch(/Anomaly/);
    expect(registry.findBestEngine('risk_scoring',{requireAvailable:true})).not.toBeNull();
    expect(registry.findBestEngine('geospatial',{requireAvailable:true})?.name).toMatch(/Geospatial/);
    expect(registry.findBestEngine('evaluation',{requireAvailable:true})?.name).toMatch(/Evaluation/);
  });

  it('does not call the external agent runtime live without credentials and a model', () => {
    expect(registry.getEngineRuntimeStatus('agent_runtime_gateway')).toEqual(expect.objectContaining({available:false,configured:false}));
    expect(registry.getEnginesByCapability('reasoning').length).toBeGreaterThan(0);
    expect(registry.getEnginesByCapability('reasoning').filter(e=>registry.getEngineRuntimeStatus(e).available)).toHaveLength(0);
  });

  it('executes deterministic specialist engines locally', async () => {
    const anomaly=await dispatch('statistical_anomaly',{history:[10,11,9,10,10,11,9],value:40});
    expect(anomaly.status).toBe('evaluated');
    expect(anomaly.anomaly).toBe(true);

    const risk=await dispatch('transparent_risk',{criteria:[
      {id:'late',value:0.9,weight:2},
      {id:'quality',value:0.2,weight:1},
    ]});
    expect(risk.status).toBe('evaluated');
    expect(risk.riskScore).toBeGreaterThan(0.5);

    const geo=await dispatch('geospatial',{operation:'distance',input:{lat1:28.6139,lng1:77.2090,lat2:28.7041,lng2:77.1025}});
    expect(geo.distanceKm).toBeGreaterThan(0);

    const evalResult=await dispatch('evaluation',{kind:'classification',rows:[
      {actual:'a',predicted:'a'},{actual:'b',predicted:'a'},
    ]});
    expect(evalResult.accuracy).toBe(0.5);
  });

  it('keeps unknown external provider cost unknown instead of using legacy static rates', () => {
    expect(cost.estimateCost('unknown-provider',1000)).toBeNull();
    expect(cost.getCostRate('openai')).toBeNull();
    const quote=cost.quoteCost('unknown-provider',{inputTokens:1000});
    expect(quote.known).toBe(false);
  });

  it('supports explicit runtime pricing without making it global billing authority', () => {
    cost.configurePricing('test-provider',{inputPer1k:0.01,outputPer1k:0.02,verifiedAt:'2026-09-25'},'unit-test');
    expect(cost.estimateCost('test-provider',1000,{inputTokens:1000,outputTokens:500})).toBeCloseTo(0.02,8);
  });

  it('reduces confidence when required evidence dimensions are missing', () => {
    const r=confidence.evaluateConfidenceStrict({modelScore:0.95},{
      requiredDimensions:[
        confidence.CONFIDENCE_DIMENSIONS.MODEL_CONFIDENCE,
        confidence.CONFIDENCE_DIMENSIONS.SOURCE_CONFIDENCE,
        confidence.CONFIDENCE_DIMENSIONS.HISTORICAL_ACCURACY,
      ],
    });
    expect(r.rawOverall).toBeGreaterThan(0.9);
    expect(r.evidenceCoverage).toBeCloseTo(1/3,3);
    expect(r.overall).toBeLessThan(0.5);
    expect(r.missingDimensions).toHaveLength(2);
  });

  it('covers all canonical domains with templates and declared engine contracts', () => {
    const c=dual.coverage();
    expect(c.canonicalDomains).toBe(36);
    expect(c.coveredDomains).toBe(36);
    expect(c.agenticTemplateCoveredDomains).toBe(36);
    expect(c.declaredEngineCoveredDomains).toBe(36);
    expect(c.missingDomains).toEqual([]);
    expect(c.declaredEngineCoverageGaps).toEqual([]);

    const templates=buildAgentTemplateRegistry().agentRegistry.list({enabled:true});
    expect(templates.length).toBeGreaterThanOrEqual(44);
    expect(new Set(templates.map(t=>t.stream)).size).toBe(36);
  });

  it('reports code completion separately from runtime configuration', () => {
    const c=completion.build();
    expect(c.codeComplete).toBe(true);
    expect(c.codeBlockers).toEqual([]);
    expect(c.runtimeFullyOperational).toBe(false);
    expect(c.configurationBlockers).toEqual(expect.arrayContaining(['external_agent_runtime_not_configured']));
    expect(c.memory.status).toBe('ready');
    expect(c.evaluation.status).toBe('ready');
  });
});
