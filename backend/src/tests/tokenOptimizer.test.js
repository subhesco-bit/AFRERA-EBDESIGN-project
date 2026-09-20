const tokenOptimizer = require('../core/ai/tokenOptimizer');
const aiCostController = require('../core/ai/aiCostController');

describe('tokenOptimizer', () => {
  afterEach(() => {
    aiCostController.setBudgets(10.0, 100.0);
  });

  it('estimates tokens from character length', () => {
    expect(tokenOptimizer.estimateTokens('')).toBe(0);
    expect(tokenOptimizer.estimateTokens('abcd')).toBe(1);
    expect(tokenOptimizer.estimateTokens('a'.repeat(400))).toBe(100);
  });

  it('leaves prompts under budget untouched', () => {
    const result = tokenOptimizer.truncatePromptToBudget('short prompt', 1000);
    expect(result.truncated).toBe(false);
    expect(result.text).toBe('short prompt');
  });

  it('truncates prompts that exceed the token budget, keeping head and tail', () => {
    const prompt = `${'A'.repeat(1000)}${'B'.repeat(1000)}`;
    const result = tokenOptimizer.truncatePromptToBudget(prompt, 100);

    expect(result.truncated).toBe(true);
    expect(result.originalTokens).toBeGreaterThan(100);
    expect(result.text).toContain('truncated to stay within');
    expect(result.text.startsWith('A')).toBe(true);
    expect(result.text.endsWith('B')).toBe(true);
  });

  it('caps requested max tokens at the provider ceiling', () => {
    expect(tokenOptimizer.capMaxTokens(10000, 4096)).toBe(4096);
    expect(tokenOptimizer.capMaxTokens(100, 4096)).toBe(100);
    expect(tokenOptimizer.capMaxTokens(undefined, 4096)).toBe(4096);
  });

  it('flags a preflight budget check as unaffordable when spend already exhausted the budget', () => {
    aiCostController.setBudgets(0.0001, 0.0001);
    const check = tokenOptimizer.preflightBudgetCheck('openai', 100000);
    expect(check.withinBudget).toBe(false);
  });

  it('optimizeRequest truncates, caps, and warns instead of throwing by default', () => {
    delete process.env.AI_TOKEN_BUDGET_ENFORCE;
    aiCostController.setBudgets(0.0001, 0.0001);

    const result = tokenOptimizer.optimizeRequest(
      'openai',
      'x'.repeat(10000),
      { maxTokens: 999999, promptTokenBudget: 50 },
      { maxTokens: 4096 },
    );

    expect(result.truncated).toBe(true);
    expect(result.maxTokens).toBe(4096);
    expect(result.budgetCheck.withinBudget).toBe(false);
  });

  it('optimizeRequest throws when AI_TOKEN_BUDGET_ENFORCE=true and budget is exceeded', () => {
    process.env.AI_TOKEN_BUDGET_ENFORCE = 'true';
    aiCostController.setBudgets(0.0001, 0.0001);

    expect(() =>
      tokenOptimizer.optimizeRequest('openai', 'hello', { maxTokens: 100 }, { maxTokens: 4096 }),
    ).toThrow(/Token-saving budget guard/);

    delete process.env.AI_TOKEN_BUDGET_ENFORCE;
  });
});
