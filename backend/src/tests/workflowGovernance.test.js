const { WorkflowDefinitionRegistry } = require('../core/workflowDefinitionRegistry');
const { registerCanonicalWorkflows } = require('../core/workflowCatalog');
const { WorkflowEngine } = require('../services/flows/workflowEngine');

describe('Workflow governance and catalog', () => {
  it('registers canonical workflows with valid states, SLAs and approvals', () => {
    const registry = new WorkflowDefinitionRegistry();
    const definitions = registerCanonicalWorkflows(registry);
    expect(definitions).toHaveLength(4);
    expect(registry.get('ECOMMERCE_ORDER_TO_CASH').states).toContain('delivered');
    expect(registry.get('ISSUE_DISPUTE_RESOLUTION').slaHours.cold_chain).toBe(12);
    expect(registry.get('PROCUREMENT_RFQ_TO_PAYMENT').approvals[0].roles).toContain('finance_manager');
  });

  it('rejects invalid transition targets and terminal outbound transitions', () => {
    const registry = new WorkflowDefinitionRegistry();
    expect(() => registry.register('BROKEN', {
      states:['a','b'], initialState:'a', terminalStates:['b'], transitions:{a:['missing'],b:['a']}
    })).toThrow(/Invalid workflow/);
  });

  it('records compensation outcomes without mutating the registered step order', async () => {
    const registry = new WorkflowDefinitionRegistry();
    const engine = new WorkflowEngine({ registry });
    engine.registerStepHandler('ok', async () => ({ ok:true }));
    engine.registerStepHandler('fail', async () => { throw new Error('boom'); });
    engine.registerStepHandler('undo', async () => ({ undone:true }));
    engine.registerWorkflow('TEST_COMP', {
      steps:[
        {id:'one',type:'ok',compensation:{type:'undo',config:{}}},
        {id:'two',type:'fail'}
      ]
    });
    const original = engine.workflows.get('TEST_COMP').steps.map((x) => x.id);
    const result = await engine.executeWorkflow('TEST_COMP', {});
    expect(result.status).toBe('failed');
    expect(result.compensations).toEqual([expect.objectContaining({stepId:'one',status:'completed'})]);
    expect(engine.workflows.get('TEST_COMP').steps.map((x) => x.id)).toEqual(original);
    expect(result.id).toMatch(/^EXEC-TEST_COMP-[0-9a-f-]{36}$/);
  });
});
