const pool = require('../database/pool');
const { record } = require('../services/moduleEventService');

jest.mock('../database/pool', () => ({ query: jest.fn() }));

describe('module event service', () => {
  it('persists a normalized module operation event', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, event_type: 'completed' }] });
    const result = await record({ moduleId: 'M001', operation: 'create', eventType: 'completed', correlationId: 'c1', payload: { ok: true } });
    expect(result.event_type).toBe('completed');
    expect(pool.query.mock.calls[0][1]).toEqual(['M001', 'create', 'completed', null, null, 'c1', '{"ok":true}', null]);
  });
});