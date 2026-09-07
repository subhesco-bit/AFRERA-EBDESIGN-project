jest.mock('../database/pool', () => ({ query: jest.fn() }));

const pool = require('../database/pool');
const dprService = require('../services/legacy/dprGenerationService');
const searchService = require('../services/advancedSearchService');

describe('ERP/DPR/search contracts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('scopes DPR reads to the authenticated owner', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 'dpr-1' }] });
    await dprService.getById('dpr-1', { userId: 'user-1', isAdmin: false });
    expect(pool.query.mock.calls[0][0]).toContain('generated_by = $2');
    expect(pool.query.mock.calls[0][1]).toEqual(['dpr-1', 'user-1']);
  });

  it('uses aligned parameters for optional search filters', async () => {
    searchService.getPool = async () => pool;
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] });
    await searchService.advancedSearch({ query: 'rice', location: 'Assam', page: 1, limit: 20 });
    const countCall = pool.query.mock.calls[1];
    expect(countCall[0]).toContain('p.location ILIKE $2');
    expect(countCall[1]).toEqual(['rice', '%Assam%']);
  });
});
