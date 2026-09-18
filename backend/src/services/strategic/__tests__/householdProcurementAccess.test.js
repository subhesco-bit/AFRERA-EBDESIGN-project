jest.mock('../../../database/pool', () => ({ query: jest.fn() }));

const pool = require('../../../database/pool');
const HouseholdProcurementService = require('../householdProcurementService');

beforeEach(() => pool.query.mockReset());

test('plan details are scoped to the head of household', async () => {
  pool.query.mockResolvedValueOnce({ rows: [] });
  const service = new HouseholdProcurementService();
  expect(await service.getProcurementPlan('plan-id', 'different-user')).toBeNull();
  expect(pool.query.mock.calls[0][0]).toContain('h.head_of_household_id=$2');
  expect(pool.query.mock.calls[0][1]).toEqual(['plan-id', 'different-user']);
});

test('operator aggregation detail is read from persisted group', async () => {
  pool.query.mockResolvedValueOnce({ rows: [{ id: 'group-id', status: 'planning' }] });
  const service = new HouseholdProcurementService();
  expect(await service.getAggregationGroup('group-id')).toEqual({ id: 'group-id', status: 'planning' });
});
