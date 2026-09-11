'use strict';

jest.mock('../../database/connection', () => ({
  getPostgreSQL: jest.fn(),
}));

const { getPostgreSQL } = require('../../database/connection');
const service = require('../operationalModuleService');

describe('operationalModuleService', () => {
  const query = jest.fn();
  const connect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getPostgreSQL.mockReturnValue({ query, connect });
  });

  test('rejects unsupported module keys', async () => {
    await expect(service.createEntity({ moduleKey: 'not-a-real-module' })).rejects.toThrow('Unsupported operational module');
  });

  test('creates an operational entity with canonical fields', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: '1', module_key: 'procurement' }] });
    const result = await service.createEntity({
      moduleKey: 'procurement',
      ownerUserId: '00000000-0000-0000-0000-000000000001',
      payload: { reference: 'PO-1' },
    });
    expect(result.module_key).toBe('procurement');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('operational_module_entities'), expect.any(Array));
  });

  test('uses parameterized filters for listing', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    await service.listEntities({ moduleKey: 'logistics', status: 'active', limit: 25, offset: 5 });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('deleted_at IS NULL'), ['logistics', 'active', null, 25, 5]);
  });

  test('wraps multi-step work in a transaction and rolls back on failure', async () => {
    const release = jest.fn();
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({}),
      release,
    };
    connect.mockResolvedValueOnce(client);

    await expect(service.withTransaction(async trx => {
      await trx.query('SELECT 1');
      throw new Error('boom');
    })).rejects.toThrow('boom');

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
