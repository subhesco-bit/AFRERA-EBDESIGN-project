const { compareOffers } = require('../farmerProcurementQuoteService');

const base = {
  id: 'offer-1', supplier_id: 'supplier-1', origin_state: 'Delhi',
  served_states: ['Assam'], status: 'approved', approved_by: 'operator-1', approved_at: '2026-09-01',
  terms_source: 'supplier RFQ 45', effective_from: '2026-09-01', effective_to: '2026-09-30',
  minimum_order_quantity: 1, available_quantity: 100, list_price_per_unit: 100,
  freight_per_order: 300, quoted_delivery_days: 4,
  bulk_tiers: [{ min_quantity: 10, price_per_unit: 85 }],
};

test('uses quoted bulk tier and allocates freight by actual pooled share', () => {
  const result = compareOffers([base], { quantity: 2, pooledQuantity: 10, destinationState: 'Assam', asOf: '2026-09-15' });
  expect(result.recommendation.supplier_unit_price).toBe(85);
  expect(result.recommendation.provisional_landed_cost_excluding_tax).toBe(230);
  expect(result.freight_status).toBe('provisional_pooled_allocation');
  expect(result.tax_status).toBe('not_calculated');
});

test('rejects unapproved, expired, unserved, unavailable and unmet-MOQ offers', () => {
  const offers = [
    { ...base, id: 'a', status: 'draft' },
    { ...base, id: 'b', effective_to: '2026-09-14' },
    { ...base, id: 'c', served_states: ['Nagaland'] },
    { ...base, id: 'd', available_quantity: 1 },
    { ...base, id: 'e', minimum_order_quantity: 11 },
  ];
  const result = compareOffers(offers, { quantity: 2, pooledQuantity: 10, destinationState: 'Assam', asOf: '2026-09-15' });
  expect(result.recommendation).toBeNull();
  expect(result.alternatives.every(a => !a.feasible)).toBe(true);
});

test('compares delivered cost rather than headline price', () => {
  const expensiveDelivery = { ...base, id: 'cheap-goods', list_price_per_unit: 70, bulk_tiers: [], freight_per_order: 900 };
  const cheaperDelivery = { ...base, id: 'lower-landed', list_price_per_unit: 90, bulk_tiers: [], freight_per_order: 100 };
  const result = compareOffers([expensiveDelivery, cheaperDelivery], { quantity: 2, destinationState: 'Assam', asOf: '2026-09-15' });
  expect(result.recommendation.offer_id).toBe('lower-landed');
});
