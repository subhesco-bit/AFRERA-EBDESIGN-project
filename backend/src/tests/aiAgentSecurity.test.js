const aiAgentService = require('../services/aiAgentService');

describe('AI agent security controls', () => {
  it('evaluates basic arithmetic without executing JavaScript', async () => {
    const calculator = aiAgentService.tools.get('calculate');
    await expect(calculator.handler({ expression: '2 + 3 * 4' })).resolves.toEqual({ success: true, result: 14 });
    await expect(calculator.handler({ expression: 'process.exit()' })).resolves.toEqual({
      success: false,
      error: 'Only numeric arithmetic expressions are allowed',
    });
  });

  it('rejects unsafe arithmetic operations', async () => {
    const calculator = aiAgentService.tools.get('calculate');
    await expect(calculator.handler({ expression: '1 / 0' })).resolves.toEqual({ success: false, error: 'Division by zero' });
    await expect(calculator.handler({ expression: '1 + (2 * 3' })).resolves.toEqual({ success: false, error: 'Unbalanced parentheses' });
  });
});