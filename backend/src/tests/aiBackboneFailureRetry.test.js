process.env.OPENAI_ENABLED = 'true';
process.env.OPENAI_API_KEY = 'test-only-key';

jest.mock('node-fetch', () => jest.fn());

const fetch = require('node-fetch');
const aiBackbone = require('../services/legacy/aiBackboneService');

describe('AI backbone provider failures and retries', () => {
  afterEach(() => {
    fetch.mockReset();
    aiBackbone.resetAIStatistics();
  });

  it('fails clearly when a provider is not configured', async () => {
    const originalEnabled = aiBackbone.AI_PROVIDERS.openai.enabled;
    const originalKey = aiBackbone.AI_PROVIDERS.openai.apiKey;
    aiBackbone.AI_PROVIDERS.openai.enabled = false;
    aiBackbone.AI_PROVIDERS.openai.apiKey = undefined;

    await expect(aiBackbone.callOpenAI('test prompt')).rejects.toThrow('OpenAI is not configured');

    aiBackbone.AI_PROVIDERS.openai.enabled = originalEnabled;
    aiBackbone.AI_PROVIDERS.openai.apiKey = originalKey;
  });

  it('retries transient provider failures and eventually rejects', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: jest.fn().mockResolvedValue('temporary outage'),
    });

    await expect(aiBackbone.callOpenAI('test prompt')).rejects.toThrow('OpenAI API error: 503');
    expect(fetch).toHaveBeenCalledTimes(3);
  }, 15000);
});
