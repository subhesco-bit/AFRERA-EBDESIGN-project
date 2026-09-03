const pool = require('../../database/pool');
const service = require('../../services/aiApprovalService');

jest.mock('../../database/pool', () => ({ query: jest.fn() }));

describe('AI approval service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires an explainable proposal payload', async () => {
    await expect(service.createProposal({ userId: 'u1', domain: 'pricing' }))
      .rejects.toThrow('domain, proposalType, proposedValue, and rationale are required');
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('creates a durable proposal owned by the caller', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, proposed_by: 'u1', status: 'proposed' }] });
    const result = await service.createProposal({
      userId: 'u1', domain: 'pricing', proposalType: 'price_change',
      proposedValue: { price: 120 }, rationale: 'Market signal supports the change'
    });
    expect(result.proposed_by).toBe('u1');
    expect(pool.query.mock.calls[0][1][0]).toBe('u1');
  });

  it('requires a reason for rejection', async () => {
    await expect(service.decideProposal({ proposalId: 1, user: { id: 'u1' }, decision: 'rejected' }))
      .rejects.toThrow('Rejection reason is required');
  });

  it('only executes approved proposals', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    await expect(service.executeProposal({ proposalId: 1, user: { id: 'u1', role: 'admin' } }))
      .rejects.toThrow('Only approved proposals can be executed');
  });
});
