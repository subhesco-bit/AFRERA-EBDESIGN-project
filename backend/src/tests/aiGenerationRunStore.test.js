'use strict';

jest.mock('../database/pool', () => ({ query: jest.fn() }));

const pool = require('../database/pool');
const store = require('../services/aiGenerationRunStore');

describe('AI generation evidence store', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue({ rows: [] }));

  test('stores hashes and policy evidence without persisting raw prompts', async () => {
    const prompt = 'private farmer question';
    const context = { villageId: 42 };
    const run = await store.start({ companyId: 7, actorId: 'actor-1', moduleId: 'M030',
      capability: 'advisory', prompt, context });

    const serialized = JSON.stringify(pool.query.mock.calls[0]);
    expect(serialized).not.toContain(prompt);
    expect(serialized).not.toContain('villageId');
    expect(serialized).toContain(store.hash(prompt));
    expect(serialized).toContain(store.hash(context));
    expect(run.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('records terminal provider evidence and token counts', async () => {
    await store.finish({ id: 'run-1', startedAt: Date.now() - 25 }, {
      status: 'generated', provider: 'openai', model: 'gpt-test',
      usage: { input_tokens: 10, output_tokens: 4, total_tokens: 14 },
    }, [{ key: 'M030' }]);

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("WHERE id=$1 AND status='running'"),
      expect.arrayContaining(['run-1', 'generated', 'openai', 'gpt-test', 10, 4, 14]));
  });
});
