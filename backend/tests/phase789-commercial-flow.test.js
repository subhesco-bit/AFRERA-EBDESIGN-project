const fulfillment = require('../src/services/fulfillmentOrchestrationService');

describe('Phase 7-9 commercial flow contracts', () => {
  test('shipment lifecycle only permits declared transitions', () => {
    expect(fulfillment.TRANSITIONS.planned).toEqual(expect.arrayContaining(['allocated', 'cancelled']));
    expect(fulfillment.TRANSITIONS.delivered).toEqual([]);
    expect(fulfillment.TRANSITIONS.failed).toEqual(expect.arrayContaining(['returned']));
  });

  test('invalid shipment transition is rejected by contract', () => {
    expect(fulfillment.TRANSITIONS.delivered.includes('in_transit')).toBe(false);
    expect(fulfillment.TRANSITIONS.planned.includes('delivered')).toBe(false);
  });
});
