'use strict';

jest.mock('../database/connection', () => ({ getPostgreSQL: jest.fn() }));
jest.mock('../core/signalBus', () => ({ signalBus: { emit: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../utils/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));

const { getPostgreSQL } = require('../database/connection');
const listing = require('../services/legacy/ecommerceService');

describe('nationwide supplier listing origin', () => {
  const seller = '11111111-1111-4111-8111-111111111111';
  const input = { product_name: 'Naga cucumber', category_id: 2, quantity: 25, unit: 'kg', base_price: 120,
    harvest_date: '2026-09-15', state_id: 18, location_id: '33333333-3333-4333-8333-333333333333',
    cold_chain_required: true, shelf_life_hours: 72 };
  let query;
  beforeEach(() => { query = jest.fn(); getPostgreSQL.mockReturnValue({ query }); });

  test('rejects a seller-controlled origin mismatch before publishing', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(listing.createProductListing(seller, input)).rejects.toThrow('Verified seller origin');
    expect(query).toHaveBeenCalledTimes(1);
  });

  test('publishes national origin and shelf-life data without a fabricated AI confidence', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: input.location_id, name: 'Nagaland' }] })
      .mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'listing-1', product_name: input.product_name, quantity: 25, base_price: 120 }] });
    const result = await listing.createProductListing(seller, input);
    const [sql, values] = query.mock.calls[3];
    expect(sql).toContain('market_reach');
    expect(values).toContain('india');
    expect(values).toContain(input.state_id);
    expect(values).toContain(72);
    expect(result.ai_insights.method).toBe('deterministic_heuristics_not_model_prediction');
    expect(result.ai_insights.price_recommendation.confidence).toBeNull();
  });

  test('seller mutation cannot change origin or owner and is scoped by seller identity', async () => {
    query.mockResolvedValue({ rows: [{ id: 'listing-1', quantity: 30 }] });
    await listing.updateSellerListing('listing-1', seller, { quantity: 30, seller_id: 'attacker', state_id: 99 });
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain('seller_id=$');
    expect(sql).not.toContain('state_id=');
    expect(values).toEqual([30, 'listing-1', seller]);
  });

  test('removal is a seller-scoped soft delete', async () => {
    query.mockResolvedValue({ rows: [{ id: 'listing-1' }] });
    const result = await listing.deleteSellerListing('listing-1', seller);
    expect(result.status).toBe('deleted');
    expect(query.mock.calls[0][0]).toContain("listing_status='deleted'");
    expect(query.mock.calls[0][1]).toEqual(['listing-1', seller]);
  });
});
