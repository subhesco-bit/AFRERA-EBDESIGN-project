/**
 * AI Backbone fallback-path tests.
 *
 * These do NOT hit a real database or a real AI provider - they mock both
 * so they run without infrastructure (no PostgreSQL, no ANTHROPIC_API_KEY
 * etc., matching the project's current unconfigured state) and verify that
 * when no AI provider is available, callers get an honestly-labeled
 * source: 'fallback' response instead of a silently-canned one.
 */

jest.mock('../../database/pool', () => ({
  query: jest.fn()
}));

jest.mock('../../database/connection', () => ({
  getPostgreSQL: jest.fn(),
  getMongoDatabase: jest.fn()
}));

jest.mock('../../middleware/auth', () => ({
  authMiddleware: (req, res, next) => next()
}));

describe('aiBackboneService.router export (regression: no-router-export landmine)', () => {
  it('exports a mountable express router alongside the AI gateway functions', () => {
    const aiBackboneService = require('../../services/legacy/aiBackboneService');
    expect(typeof aiBackboneService.router).toBe('object');
    expect(typeof aiBackboneService.router.use).toBe('function');
    expect(typeof aiBackboneService.analyze).toBe('function');
    expect(typeof aiBackboneService.optimize).toBe('function');
    expect(typeof aiBackboneService.predict).toBe('function');
    expect(typeof aiBackboneService.recommend).toBe('function');
    // completeAIIntegrationController.js calls these directly on the
    // required module - they were silently dropped by an earlier
    // consolidation of this file's module.exports blocks.
    expect(typeof aiBackboneService.optimizeSheepProduction).toBe('function');
    expect(typeof aiBackboneService.optimizePigProduction).toBe('function');
  });

  it('only has a single module.exports block (no duplicate top-level export overwrite)', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.join(__dirname, '../../services/legacy/aiBackboneService.js'),
      'utf8'
    );
    const matches = src.match(/^module\.exports\s*=/gm) || [];
    expect(matches.length).toBe(1);
  });
});

describe('conversationalAIService.generateResponse fallback path', () => {
  const pool = require('../../database/pool');

  beforeEach(() => {
    jest.resetModules();
    pool.query.mockReset();
  });

  it('labels the response source: "fallback" and returns the template answer when no AI provider is configured', async () => {
    pool.query
      // getConversationSession
      .mockResolvedValueOnce({ rows: [{ session_id: 'S1', domain_id: 1, user_id: 'u1' }] })
      // getConversationMessages (recent history for the prompt)
      .mockResolvedValueOnce({ rows: [] });

    const conversationalAIService = require('../../services/legacy/conversationalAIService');
    const result = await conversationalAIService.generateResponse('S1', 'Hello there!');

    expect(result.source).toBe('fallback');
    expect(result.intent).toBe('greeting');
    expect(typeof result.content).toBe('string');
    expect(result.content.length).toBeGreaterThan(0);
  });
});
