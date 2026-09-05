const express = require('express');
const request = require('supertest');

jest.mock('../modules/M029/service', () => ({
  getHealthRecord: jest.fn(),
  createHealthRecord: jest.fn()
}));

jest.mock('../core/claudeAICoordinator', () => ({
  coordinateAIRequest: jest.fn()
}));

jest.mock('../middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    req.user = { id: 'user-123' };
    next();
  }
}));

jest.mock('../middleware/rateLimit', () => ({
  rateLimiters: { api: (req, res, next) => next() }
}));

const moduleService = require('../modules/M029/service');
const claudeAICoordinator = require('../core/claudeAICoordinator');
const router = require('../routes/claude/backendModuleBridge');

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use(router);
  return instance;
}

describe('backend module AI decision route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    claudeAICoordinator.coordinateAIRequest.mockResolvedValue({ recommendation: 'review' });
  });

  it('dispatches a decision request with the contract and never executes a module operation', async () => {
    await request(app())
      .post('/M029/ai-decision')
      .set('x-session-id', 'session-456')
      .send({ question: 'Should this health record be reviewed?', operation: 'createHealthRecord', context: { recordId: 7 } })
      .expect(200)
      .expect(response => {
        expect(response.body.data.module_contract.module_id).toBe('M029');
        expect(response.body.data.decision).toEqual({ recommendation: 'review' });
        expect(response.body.data.decision_mode).toBe('ai_proposes_human_approves');
        expect(response.body.data.executes_commands).toBe(false);
        expect(response.body.data.human_approval_required).toBe(true);
        expect(response.body.data.provenance).toEqual({
          coordinator: 'claudeAICoordinator',
          request_type: 'module_decision',
          module_id: 'M029'
        });
      });

    expect(claudeAICoordinator.coordinateAIRequest).toHaveBeenCalledWith(expect.objectContaining({
      requestType: 'module_decision',
      query: 'Should this health record be reviewed?',
      userId: 'user-123',
      sessionId: 'session-456',
      context: expect.objectContaining({
        module_contract: expect.objectContaining({ module_id: 'M029' }),
        operation_context: { operation: 'createHealthRecord', context: { recordId: 7 } }
      })
    }));
    expect(moduleService.createHealthRecord).not.toHaveBeenCalled();
    expect(moduleService.getHealthRecord).not.toHaveBeenCalled();
  });

  it.each([
    [{ question: '   ' }],
    [{ question: 'valid', operation: 'doesNotExist' }],
    [{ question: 'valid', context: [] }],
    [{ question: 'valid', context: null }]
  ])('returns 400 without dispatch for invalid input: %j', async body => {
    await request(app())
      .post('/M029/ai-decision')
      .send(body)
      .expect(400);

    expect(claudeAICoordinator.coordinateAIRequest).not.toHaveBeenCalled();
  });
});