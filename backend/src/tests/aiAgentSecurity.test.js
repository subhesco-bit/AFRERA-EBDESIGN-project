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

  it('rejects private and metadata destinations for HTTP tools', async () => {
    const apiTool = aiAgentService.tools.get('call_api');
    await expect(apiTool.handler({ url: 'http://127.0.0.1:8080/admin', method: 'GET' }))
      .rejects.toThrow('Private or metadata destinations are not allowed');
    await expect(apiTool.handler({ url: 'http://169.254.169.254/latest/meta-data', method: 'GET' }))
      .rejects.toThrow('Private or metadata destinations are not allowed');
  });
});
