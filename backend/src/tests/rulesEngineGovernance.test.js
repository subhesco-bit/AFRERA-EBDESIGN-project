const { RulesEngine } = require('../platform/rules/rulesEngine');

describe('Deterministic RulesEngine', () => {
  it('evaluates nested all/any/not conditions with trace', async () => {
    const engine = new RulesEngine();
    await engine.registerRule('ELIGIBLE', {
      category:'subsidy',
      priority:10,
      conditions:{all:[
        {field:'farmer.landHa',operator:'lte',value:2},
        {any:[{field:'farmer.state',operator:'eq',value:'AS'},{field:'farmer.state',operator:'eq',value:'NL'}]},
        {not:{field:'farmer.blacklisted',operator:'eq',value:true}}
      ]},
      actions:[{type:'mark_candidate'}]
    }, {persist:false});
    const result=await engine.evaluateRule('ELIGIBLE',{farmer:{landHa:1.2,state:'AS',blacklisted:false}});
    expect(result.passed).toBe(true);
    expect(result.trace.length).toBe(4);
    expect(result.actions).toEqual([{type:'mark_candidate'}]);
  });

  it('rejects malformed definitions and unknown operators', async () => {
    const engine=new RulesEngine();
    await expect(engine.registerRule('BAD',{conditions:{field:'x',operator:'eval_js',value:'x'}},{persist:false})).rejects.toThrow(/Invalid rule/);
  });

  it('honours effective windows and priorities', async () => {
    const engine=new RulesEngine();
    await engine.registerRule('LATER',{category:'price',priority:1,effectiveFrom:'2030-01-01T00:00:00Z',conditions:{field:'x',operator:'eq',value:1}},{persist:false});
    const result=await engine.evaluateRule('LATER',{x:1},{at:'2026-09-25T00:00:00Z'});
    expect(result.applicable).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('executes only registered action handlers', async () => {
    const engine=new RulesEngine();
    await engine.registerRule('ACT',{conditions:{field:'ok',operator:'eq',value:true},actions:[{type:'tag',value:'x'}]},{persist:false});
    engine.registerActionHandler('tag',async ({action})=>({tag:action.value}));
    const out=await engine.executeRuleActions('ACT',{ok:true});
    expect(out.executed).toBe(true);
    expect(out.results[0].result).toEqual({tag:'x'});
  });

  it('loads and saves through a repository adapter without hard-coding a rule table', async () => {
    const saved=[];
    const repository={
      listRules:async()=>[{code:'R1',category:'quality',conditions:{field:'grade',operator:'in',value:['A','B']}}],
      saveRule:async(rule)=>saved.push(rule)
    };
    const engine=new RulesEngine({repository});
    await engine.initialize();
    expect((await engine.evaluateRule('R1',{grade:'A'})).passed).toBe(true);
    await engine.registerRule('R2',{conditions:{field:'x',operator:'exists',value:true}});
    expect(saved).toHaveLength(1);
  });
});
