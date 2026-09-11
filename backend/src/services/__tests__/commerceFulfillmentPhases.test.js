const commerce=require('../commerceOrderOrchestrationService');
const fulfillment=require('../fulfillmentOrchestrationService');

describe('commerce order orchestration',()=>{
  test('allows the canonical order lifecycle',()=>{
    expect(commerce.ALLOWED_TRANSITIONS.draft).toContain('placed');
    expect(commerce.ALLOWED_TRANSITIONS.placed).toContain('confirmed');
    expect(commerce.ALLOWED_TRANSITIONS.confirmed).toContain('allocated');
    expect(commerce.ALLOWED_TRANSITIONS.allocated).toContain('shipped');
    expect(commerce.ALLOWED_TRANSITIONS.shipped).toContain('delivered');
    expect(commerce.ALLOWED_TRANSITIONS.delivered).toContain('closed');
  });
  test('does not allow reopening a closed order',()=>expect(commerce.ALLOWED_TRANSITIONS.closed).toEqual([]));
});

describe('fulfillment orchestration',()=>{
  test('allows planned to allocated to delivery',()=>{
    expect(fulfillment.TRANSITIONS.planned).toContain('allocated');
    expect(fulfillment.TRANSITIONS.allocated).toContain('picked_up');
    expect(fulfillment.TRANSITIONS.picked_up).toContain('in_transit');
    expect(fulfillment.TRANSITIONS.in_transit).toContain('out_for_delivery');
    expect(fulfillment.TRANSITIONS.out_for_delivery).toContain('delivered');
  });
  test('does not allow delivery to move backwards',()=>expect(fulfillment.TRANSITIONS.delivered).toEqual([]));
});
