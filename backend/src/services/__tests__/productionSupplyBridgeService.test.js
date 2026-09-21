'use strict';

jest.mock('../../database/connection', () => ({ getPostgreSQL: jest.fn() }));

const { getPostgreSQL } = require('../../database/connection');
const service = require('../productionSupplyBridgeService');

describe('productionSupplyBridgeService', () => {
  afterEach(() => jest.clearAllMocks());

  test('validates required lot fields', async () => {
    await expect(service.createLot({ quantity: 10 }))
      .rejects.toThrow('farmerId is required');
  });

  test('validates positive quantity', async () => {
    await expect(service.createLot({ farmerId: '00000000-0000-0000-0000-000000000001', productName: 'Turmeric', quantity: 0 }))
      .rejects.toThrow('quantity must be greater than zero');
  });

  test('creates a production lot with parameterized SQL', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [{ id: 'lot-1', product_name: 'Turmeric' }] });
    getPostgreSQL.mockReturnValue({ query });

    const result = await service.createLot({
      farmerId: '00000000-0000-0000-0000-000000000001',
      productName: 'Turmeric',
      quantity: 500,
      unit: 'kg',
    });

    expect(result.id).toBe('lot-1');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO production_supply_lots'), expect.any(Array));
  });

  test('rolls back marketplace listing when the listing/link transaction fails', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 'lot-1', status: 'available', quantity: 100, unit: 'kg', product_name: 'Turmeric', quality_grade: 'A' }] })
        .mockRejectedValueOnce(new Error('listing failed')),
      release: jest.fn(),
    };
    getPostgreSQL.mockReturnValue({ connect: jest.fn().mockResolvedValue(client) });

    await expect(service.createMarketplaceListing({ lotId: 'lot-1' }))
      .rejects.toThrow('listing failed');

    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});
