'use strict';

jest.mock('../../database/connection', () => ({
  getPostgreSQL: jest.fn(),
}));

const { getPostgreSQL } = require('../../database/connection');
const service = require('../villageSupplyService');

describe('villageSupplyService', () => {
  afterEach(() => jest.clearAllMocks());

  test('rejects unsupported demand layers', async () => {
    await expect(service.createDemand({
      villageId: 1,
      demandLayer: 'unknown',
      itemId: 1,
      requiredQuantity: 2,
      unit: 'unit',
      needPeriodStart: '2026-09-11',
    })).rejects.toThrow('Invalid demand layer');
  });

  test('rejects invalid priority', async () => {
    await expect(service.createDemand({
      villageId: 1,
      demandLayer: 'village',
      itemId: 1,
      requiredQuantity: 2,
      unit: 'unit',
      needPeriodStart: '2026-09-11',
      priority: 'urgent',
    })).rejects.toThrow('Invalid priority');
  });

  test('catalog uses parameterized filters', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    getPostgreSQL.mockReturnValue({ query });

    await service.listCatalog({ demandLayer: 'household', category: 'medicine' });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('demand_layer = $1'), ['household', 'medicine']);
  });

  test('order creation rolls back when a line is invalid', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 10 }] })
        .mockRejectedValueOnce(new Error('invalid line')),
      release: jest.fn(),
    };
    getPostgreSQL.mockReturnValue({ connect: jest.fn().mockResolvedValue(client) });

    await expect(service.createOrder({
      villageId: 1,
      demandLayer: 'village',
      lines: [{ itemId: 2, quantity: 0 }],
    })).rejects.toThrow('invalid line');

    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});
