const express = require('express');
const request = require('supertest');

jest.mock('../database/pool', () => ({ query: jest.fn() }));
jest.mock('../core/claudeAICoordinator', () => ({}));
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const pool = require('../database/pool');
const auth = require('../services/dual-use/authService');
const villageProfiles = require('../services/legacy/villageProfileService');

describe('village profile HTTP contract', () => {
  let app;
  let token;
  let previousSkipAuth;
  const base = '/api/v1/village-profiles';

  beforeAll(() => {
    previousSkipAuth = process.env.SKIP_AUTH;
    delete process.env.SKIP_AUTH;
    app = express();
    app.use(express.json());
    villageProfiles.setupRoutes(app);
    app.get('/optional-profile', require('../middleware/auth').optionalAuth,
      (req, res) => res.json({ userId: req.user?.id ?? null }));
    token = auth.generateAccessToken({ id: 7, email: 'farmer@example.com', role: 'farmer' });
  });
  afterAll(() => {
    if (previousSkipAuth === undefined) delete process.env.SKIP_AUTH;
    else process.env.SKIP_AUTH = previousSkipAuth;
  });
  beforeEach(() => pool.query.mockReset());

  test('anonymous search is rejected before database access', async () => {
    await request(app).get(`${base}/villages/search`).expect(401);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('refresh tokens cannot authorize village data access', async () => {
    const refresh = auth.generateRefreshToken({ id: 7 });
    await request(app).get(`${base}/villages/search`)
      .set('Authorization', `Bearer ${refresh}`).expect(401);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('optional authentication does not turn refresh credentials into an identity', async () => {
    const refresh = auth.generateRefreshToken({ id: 7 });
    const anonymous = await request(app).get('/optional-profile')
      .set('Authorization', `Bearer ${refresh}`).expect(200);
    expect(anonymous.body.userId).toBeNull();
    const signedIn = await request(app).get('/optional-profile')
      .set('Authorization', `Bearer ${token}`).expect(200);
    expect(signedIn.body.userId).toBe(7);
  });

  test.each(['Basic', 'Token', ''])('rejects unsupported authorization scheme %s', async scheme => {
    await request(app).get(`${base}/villages/search`)
      .set('Authorization', scheme ? `${scheme} ${token}` : token).expect(401);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('search reaches the canonical SQL service, preserving query filters', async () => {
    const village = { id: 41, name: 'Test village', district: 'Test district', state: 'Test state' };
    pool.query.mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [village] });
    const response = await request(app).get(`${base}/villages/search`)
      .query({ search: "rice' OR 1=1 --", district: 'Test district' })
      .set('Authorization', `Bearer ${token}`).expect(200);
    expect(response.body).toEqual({ success: true, data: [village] });
    expect(pool.query).toHaveBeenCalledTimes(2);
    const [sql, parameters] = pool.query.mock.calls[0];
    expect(sql).toContain('COUNT(*)');
    expect(sql).not.toContain("rice' OR 1=1 --");
    expect(parameters).toEqual(['Test district', "%rice' OR 1=1 --%"]);
  });

  test('empty search returns an empty array, without creating a village', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [] });
    const response = await request(app).get(`${base}/villages/search`)
      .set('Authorization', `Bearer ${token}`).expect(200);
    expect(response.body.data).toEqual([]);
    expect(pool.query.mock.calls.every(([sql]) => sql.startsWith('SELECT'))).toBe(true);
  });

  test('numeric village profile lookup remains available', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 41, name: 'Test village' }] });
    const response = await request(app).get(`${base}/villages/41`)
      .set('Authorization', `Bearer ${token}`).expect(200);
    expect(response.body.data.id).toBe(41);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM villages WHERE id = $1', [41]);
  });

  test('canonical UUID village profile lookup remains available', async () => {
    const id = '31440cc6-d080-48a5-9429-19d4bce84442';
    pool.query.mockResolvedValueOnce({ rows: [{ id, name: 'UUID village' }] });
    const response = await request(app).get(`${base}/villages/${id}`)
      .set('Authorization', `Bearer ${token}`).expect(200);
    expect(response.body.data.id).toBe(id);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM villages WHERE id = $1', [id]);
  });

  test.each(['0', '-1', '9007199254740993', 'not-an-id'])('rejects invalid village ID %s before querying', async id => {
    await request(app).get(`${base}/villages/${id}`)
      .set('Authorization', `Bearer ${token}`).expect(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test.each([{ name: '' }, { district: null }, { state: 42 }])(
    'rejects invalid village master updates %j before querying', async changes => {
      await request(app).put(`${base}/villages/41`).send(changes)
        .set('Authorization', `Bearer ${token}`).expect(400);
      expect(pool.query).not.toHaveBeenCalled();
    },
  );

  test('rejects malformed create fields as validation errors', async () => {
    await request(app).post(`${base}/villages`)
      .send({ name: 123, district: 'District', state: 'State' })
      .set('Authorization', `Bearer ${token}`).expect(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('database failure is not represented as an empty successful search', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database unavailable'));
    const response = await request(app).get(`${base}/villages/search`)
      .set('Authorization', `Bearer ${token}`).expect(500);
    expect(response.body.success).toBe(false);
  });
});
