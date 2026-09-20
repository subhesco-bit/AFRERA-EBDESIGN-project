process.env.CLAUDE_ENABLED = 'true';
process.env.CLAUDE_API_KEY = 'test-only-key';
process.env.OPENAI_ENABLED = 'true';
process.env.OPENAI_API_KEY = 'test-only-key';
process.env.GEMINI_ENABLED = 'true';
process.env.GEMINI_API_KEY = 'test-only-key';

jest.mock('node-fetch', () => jest.fn());

const fetch = require('node-fetch');
const aiBackbone = require('../services/legacy/aiBackboneService');

describe('AI provider routing strategies', () => {
  afterEach(() => {
    fetch.mockReset();
    aiBackbone.resetAIStatistics();
  });

  it('defaults to the fixed quality preference order (claude first)', () => {
    expect(aiBackbone.getPreferredProvider()).toBe('claude');
    expect(aiBackbone.getPreferredProvider('quality')).toBe('claude');
  });

  it('picks the cheapest enabled provider under the cost strategy', () => {
    // COST_RATES: claude 0.003, openai 0.002, gemini 0.001 - gemini is cheapest.
    expect(aiBackbone.getPreferredProvider('cost')).toBe('gemini');
  });

  it('falls back to openai for cost when only claude and openai are enabled', () => {
    const originalGeminiEnabled = aiBackbone.AI_PROVIDERS.gemini.enabled;
    aiBackbone.AI_PROVIDERS.gemini.enabled = false;

    expect(aiBackbone.getPreferredProvider('cost')).toBe('openai');

    aiBackbone.AI_PROVIDERS.gemini.enabled = originalGeminiEnabled;
  });

  it('callAI with provider "auto" and strategy "cost" tries the cheapest provider first', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [{ content: { parts: [{ text: 'hi from gemini' }] }, finishReason: 'STOP' }],
        usageMetadata: {},
      }),
    });

    const result = await aiBackbone.callAI('test prompt', { provider: 'auto', strategy: 'cost' });

    expect(result.provider).toBe('gemini');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain('generativelanguage.googleapis.com');
  });

  it('callAI with provider "auto" and no strategy keeps trying claude first', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'hi from claude' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 3 },
      }),
    });

    const result = await aiBackbone.callAI('test prompt', { provider: 'auto' });

    expect(result.provider).toBe('claude');
    expect(fetch.mock.calls[0][0]).toContain('api.anthropic.com');
  });

  it('does not leak routing-only fields (provider, strategy) into the Claude/OpenAI request body', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'hi' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 3 },
      }),
    });

    await aiBackbone.callAI('test prompt', { provider: 'auto', strategy: 'quality' });

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.provider).toBeUndefined();
    expect(body.strategy).toBeUndefined();
  });
});
