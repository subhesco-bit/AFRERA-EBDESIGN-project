jest.mock('../database/pool', () => ({ query: jest.fn() }));
jest.mock('../database/connection', () => ({ getPostgreSQL: jest.fn() }));
jest.mock('../services/legacy/aiService', () => ({ aiAPI: { generateRecommendation: jest.fn() } }));

const pool = require('../database/pool');
const m016 = require('../modules/M016/service');
const m084 = require('../modules/M084/service');

describe('critical module validation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('M016 rejects non-UUID user IDs before querying', async () => {
    await expect(m016.createFederatedIdentity({ userId: 'user-1', provider: 'google', providerUserId: 'x' }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400 });
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('M016 rejects unsafe identity IDs', async () => {
    await expect(m016.getFederatedIdentity('abc')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('M084 rejects invalid alert windows without creating an alert', async () => {
    await expect(m084.createDisasterAlert({
      alert_code: 'A-1', alert_type: 'flood', severity: 'warning', headline: 'Flood',
      recommended_action: 'Hold dispatch', effective_from: '2026-09-02T10:00:00Z', effective_until: '2026-09-02T09:00:00Z'
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400 });
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('M084 creates an operator-authored alert with metadata-only advisory provenance', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 7, alert_code: 'A-7', severity: 'watch' }] });
    const result = await m084.createDisasterAlert({
      alert_code: 'A-7', alert_type: 'heavy_rain', severity: 'watch', headline: 'Heavy rain',
      recommended_action: 'Review route', effective_from: '2026-09-02T10:00:00Z', effective_until: '2026-09-03T10:00:00Z'
    });
    expect(result.ai_advisory_metadata).toEqual({ status: 'not_generated', source: 'operator_authored' });
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO climate_alerts'), expect.any(Array));
  });
});
