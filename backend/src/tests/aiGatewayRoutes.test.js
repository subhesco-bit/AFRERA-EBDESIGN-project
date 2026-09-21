const express = require('express');
const request = require('supertest');

jest.mock('../middleware/auth', () => ({
  authMiddleware: (req, _res, next) => {
    req.user = { id: 'user-1', role: 'admin' };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
  userRateLimit: () => (_req, _res, next) => next(),
}));

jest.mock('../services/aiGatewayService', () => ({
  run: jest.fn(),
}));

jest.mock('../services/legacy/aiBackboneService', () => {
  const providers = {
    openai: { enabled: true, apiKey: 'never-return-this', model: 'configured-model' },
    ollama: { enabled: false, model: 'local-model' },
  };
  return {
    AI_PROVIDERS: providers,
    getAIProviderStatus: jest.fn(() => ({
      providers: {
        openai: { enabled: providers.openai.enabled, configured: true, model: providers.openai.model },
        ollama: { enabled: providers.ollama.enabled, configured: true, model: providers.ollama.model },
      },
      statistics: { totalRequests: 3, successfulRequests: 2, failedRequests: 1 },
      availableProviders: providers.openai.enabled ? ['openai'] : [],
    })),
  };
});

const gateway = require('../services/aiGatewayService');
const aiBackbone = require('../services/legacy/aiBackboneService');
const routes = require('../routes/aiGatewayRoutes');

const app = express().use(express.json()).use('/gateway', routes);

describe('AI gateway HTTP contract', () => {
  beforeEach(() => jest.clearAllMocks());

  test('reports real provider readiness without exposing credentials', async () => {
    const response = await request(app).get('/gateway/providers').expect(200);
    expect(response.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: 'openai', available: true, model: 'configured-model' }),
    ]));
    expect(JSON.stringify(response.body)).not.toContain('never-return-this');
  });

  test('runs governed model generation with module context', async () => {
    gateway.run.mockResolvedValue({
      success: true,
      status: 'generated',
      content: 'provider output',
      provider: 'openai',
    });

    const response = await request(app).post('/gateway/chat').send({
      moduleId: 'gst',
      capability: 'gst-compliance-review',
      prompt: 'Review this deterministic GST calculation',
      context: { calculationId: 'calc-1' },
      provider: 'openai',
      temperature: 0,
    }).expect(200);

    expect(response.body.content).toBe('provider output');
    expect(gateway.run).toHaveBeenCalledWith(expect.objectContaining({
      moduleId: 'gst',
      provider: 'openai',
      temperature: 0,
    }));
  });

  test('fails honestly when no model provider is configured', async () => {
    gateway.run.mockResolvedValue({
      success: false,
      status: 'not_configured',
      error: 'AI provider unavailable. No generated answer was returned.',
    });
    await request(app).post('/gateway/chat').send({ prompt: 'hello' }).expect(503);
  });

  test('streams a governed completion as a valid SSE event', async () => {
    gateway.run.mockResolvedValue({ success: true, status: 'generated', content: 'done' });
    const response = await request(app).post('/gateway/stream').send({ prompt: 'hello' }).expect(200);
    expect(response.headers['content-type']).toMatch(/text\/event-stream/);
    expect(response.text).toContain('event: completion');
    expect(response.text).toContain('"content":"done"');
  });

  test('allows an administrator to disable a known provider at runtime', async () => {
    const response = await request(app).put('/gateway/providers/openai/disable').expect(200);
    expect(aiBackbone.AI_PROVIDERS.openai.enabled).toBe(false);
    expect(response.body.data.available).toBe(false);
    aiBackbone.AI_PROVIDERS.openai.enabled = true;
  });
});
