const { classifyOperation, buildModuleContract } = require('../core/moduleContract');

describe('module contract', () => {
  it('classifies module operations and enforces advisory-only AI execution', () => {
    expect(classifyOperation('createOrder')).toBe('command');
    expect(classifyOperation('getOrder')).toBe('query');
    const contract = buildModuleContract('M001', { createOrder() {}, getOrder() {} }, { domain: 'commerce' });
    expect(contract.domain).toBe('commerce');
    expect(contract.decision_mode).toBe('ai_proposes_human_approves');
    expect(contract.safety.executes_commands).toBe(false);
  });
});
