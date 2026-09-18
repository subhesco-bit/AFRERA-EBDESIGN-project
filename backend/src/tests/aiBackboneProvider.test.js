describe('real AI backbone provider contract', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('auto-enables OpenAI when a key exists and sends only provider-supported fields', async () => {
    process.env.OPENAI_API_KEY = 'secret-test-key';
    delete process.env.OPENAI_ENABLED;
    const fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: 'real provider response',
        model: 'configured-model',
        status: 'completed',
        usage: { total_tokens: 12 },
      }),
    });
    jest.doMock('node-fetch', () => fetch);

    const backbone = require('../services/legacy/aiBackboneService');
    const result = await backbone.callAI('governed prompt', {
      provider: 'openai',
      model: 'configured-model',
      maxTokens: 321,
      temperature: 0,
      timeoutMs: 5_000,
    });

    expect(backbone.AI_PROVIDERS.openai.enabled).toBe(true);
    expect(result.content).toBe('real provider response');
    const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(requestBody).toEqual({
      model: 'configured-model',
      input: 'governed prompt',
      max_output_tokens: 321,
    });
    expect(requestBody).not.toHaveProperty('provider');
    expect(requestBody).not.toHaveProperty('timeoutMs');
    expect(fetch.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer secret-test-key');
  });

  test('rejects an unknown provider instead of silently routing elsewhere', async () => {
    jest.doMock('node-fetch', () => jest.fn());
    const backbone = require('../services/legacy/aiBackboneService');
    await expect(backbone.callAI('prompt', { provider: 'invented-provider' }))
      .rejects.toThrow('Unknown AI provider');
  });

  test('does not retry an exhausted OpenAI credit balance', async () => {
    process.env.OPENAI_API_KEY = 'secret-test-key';
    const fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: { code: 'credit_balance_exhausted' } }),
    });
    jest.doMock('node-fetch', () => fetch);
    const backbone = require('../services/legacy/aiBackboneService');

    await expect(backbone.callAI('prompt', { provider: 'openai' }))
      .rejects.toThrow('OpenAI API quota is exhausted');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(backbone.aiRequestTracker.failedRequests).toBe(1);
  });

  test('has no preferred provider when none is configured', () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.CLAUDE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.AZURE_OPENAI_API_KEY;
    delete process.env.HUGGINGFACE_API_KEY;
    delete process.env.OLLAMA_ENABLED;
    jest.doMock('node-fetch', () => jest.fn());
    const backbone = require('../services/legacy/aiBackboneService');
    expect(backbone.getPreferredProvider()).toBeNull();
  });
});
