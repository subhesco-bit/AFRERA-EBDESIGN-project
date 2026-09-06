jest.mock('../database/connection', () => ({
  getPostgreSQL: jest.fn(),
}));

jest.mock('../database/pool', () => ({
  query: jest.fn(),
}));

const pool = require('../database/pool');
const { requireFarmerOwner } = require('../middleware/ownership');

describe('M030 farmer ownership', () => {
  beforeEach(() => jest.clearAllMocks());

  test('replaces a forged query farmer id with the caller farmer id', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 'farmer-owned' }] });
    const request = { user: { id: 'user-1', role: 'farmer' }, query: { farmerId: 'other-farmer' } };
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await requireFarmerOwner()(request, response, next);

    expect(request.query.farmerId).toBe('farmer-owned');
    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
  });

  test('fails closed when the caller has no farmer profile', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const request = { user: { id: 'user-1', role: 'farmer' }, body: {} };
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await requireFarmerOwner('body')(request, response, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
