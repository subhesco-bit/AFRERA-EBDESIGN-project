jest.mock('../middleware/auth', () => ({
  authMiddleware: (req, res, next) => { req.user = { id: 'test-user', role: 'admin', permissions: ['*'] }; next(); },
  userRateLimit: () => (req, res, next) => next(),
}));

const express = require('express');
const request = require('supertest');
const router = require('../routes/aiAgentRoutes');

describe('AI agent template HTTP API', () => {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/v1/ai/agents', router);

  beforeEach(() => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.AI_AGENT_DEFAULT_MODEL;
    delete process.env.AI_GATEWAY_DEFAULT_MODEL;
  });

  it('reports template/tool/runtime health without exposing credentials', async () => {
    const res = await request(app).get('/api/v1/ai/agents/health');
    expect(res.status).toBe(200);
    expect(res.body.templates).toBeGreaterThanOrEqual(25);
    expect(res.body.medicalTemplates).toBeGreaterThanOrEqual(8);
    expect(res.body.runtime.executable).toBe(false);
    expect(JSON.stringify(res.body)).not.toMatch(/api[_-]?key.*configured-value/i);
  });

  it('lists safe metadata only and never returns system instructions', async () => {
    const res = await request(app).get('/api/v1/ai/agents/templates?stream=medical');
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(8);
    expect(res.body.templates.every((t) => t.stream === 'medical')).toBe(true);
    for (const row of res.body.templates) {
      expect(row.prompt.instructions).toBeUndefined();
      expect(row.prompt.instructionsSha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('returns a review-gated public plan for medical coding', async () => {
    const res = await request(app).post('/api/v1/ai/agents/plan').send({
      templateId: 'MEDICAL_CODING_ASSISTANT',
      input: { documentation: 'example' },
    });
    expect(res.status).toBe(200);
    expect(res.body.plan.executionPolicy.outputUsePolicy.draftOnly).toBe(true);
    expect(res.body.plan.executionPolicy.approvalPolicy.humanReviewRequired).toBe(true);
    expect(res.body.plan._private).toBeUndefined();
  });

  it('fails truthfully instead of faking execution when runtime is not configured', async () => {
    const res = await request(app).post('/api/v1/ai/agents/execute').send({
      templateId: 'DEEP_RESEARCH',
      input: { question: 'test' },
    });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('AI_AGENT_RUNTIME_NOT_CONFIGURED');
  });

  it('enforces the 100 KiB input bound before model execution', async () => {
    const res = await request(app).post('/api/v1/ai/agents/plan').send({
      templateId: 'DEEP_RESEARCH',
      input: { text: 'x'.repeat(110 * 1024) },
    });
    expect(res.status).toBe(413);
    expect(res.body.code).toBe('AGENT_INPUT_TOO_LARGE');
  });
});
