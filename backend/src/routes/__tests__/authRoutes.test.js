/**
 * POST /api/auth/* — behavioural tests for the real auth router.
 *
 * These run against the dev/test fallback credential store, so they need no
 * database and are safe in CI. AUTH_STORE_PATH is pointed at a per-run temp
 * file so the checkout is never written to.
 *
 * What they pin down, and why each matters:
 *
 *  1. The router delegates to services/dual-use/authService. It used to keep
 *     users in a process-local Map with PLAINTEXT passwords and hand out
 *     fabricated `jwt_<userId>_<timestamp>` strings.
 *  2. A token minted by login is accepted by middleware/auth. Before this,
 *     login and authorization were two different systems: the mock's tokens
 *     were (correctly) rejected by the real verifier, so a "successful" login
 *     granted no access.
 *  3. Refresh works. Refresh tokens carry only { userId, tokenType }, but the
 *     fallback path looked the user up by payload.email, so refresh failed on
 *     every deployment without PostgreSQL.
 *  4. The old mock token format is rejected.
 */

'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');

const TEMP_STORE = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), 'afrera-auth-test-')),
  'auth_store.json',
);

// Must be set before authService is loaded: the path is read at module scope.
process.env.AUTH_STORE_PATH = TEMP_STORE;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-jwt-secret-for-jest';
// Force the fallback path regardless of what else is listening locally.
process.env.PG_PORT = '59999';

const express = require('express');
const request = require('supertest');

const authRoutes = require('../authRoutes');
const { authMiddleware } = require('../../middleware/auth');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.get('/api/protected', authMiddleware, (req, res) => res.json({ ok: true, user: req.user }));
  return app;
}

const app = buildApp();
const PASSWORD = 'Str0ng!Passw0rd';
let email;
let registered;

beforeAll(async () => {
  email = `authroutes-${Date.now()}@example.com`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: PASSWORD, first_name: 'Auth', last_name: 'Routes' });
  registered = res;
});

afterAll(() => {
  fs.rmSync(path.dirname(TEMP_STORE), { recursive: true, force: true });
});

describe('POST /api/auth/register', () => {
  it('creates the account and returns 201', () => {
    expect(registered.status).toBe(201);
    expect(registered.body.success).toBe(true);
  });

  it('returns a real signed JWT, not the old jwt_<id>_<ts> mock format', () => {
    const token = registered.body.data.accessToken;
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
    expect(token.startsWith('jwt_')).toBe(false);
  });

  it('keeps the legacy `token` field alongside the canonical names', () => {
    expect(registered.body.data.token).toBe(registered.body.data.accessToken);
    expect(typeof registered.body.data.refreshToken).toBe('string');
  });

  it('never echoes the submitted password', () => {
    expect(JSON.stringify(registered.body)).not.toContain(PASSWORD);
  });

  it('does not store the password in cleartext', () => {
    const store = JSON.parse(fs.readFileSync(TEMP_STORE, 'utf8'));
    const record = store.users.find((u) => u.email === email);
    expect(record).toBeDefined();
    expect(record.password_hash).toMatch(/^\$2[aby]\$/);
    expect(JSON.stringify(record)).not.toContain(PASSWORD);
  });

  it('rejects a duplicate email with 409', async () => {
    const res = await request(app).post('/api/auth/register').send({ email, password: PASSWORD });
    expect(res.status).toBe(409);
  });

  it('rejects a missing password with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 and a usable token for correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken.split('.')).toHaveLength(3);
  });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for an unknown account, not 404', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('login and authorization are one system', () => {
  it('accepts a login token on a route guarded by middleware/auth', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.status).toBe(401);
  });

  it('rejects a token in the retired mock format', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer jwt_user_1789981049426_abc');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('issues a working access token from a refresh token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken });

    expect(res.status).toBe(200);

    const protectedRes = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${res.body.data.accessToken}`);
    expect(protectedRes.status).toBe(200);
  });

  it('refuses an access token presented as a refresh token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.data.accessToken });
    expect(res.status).toBe(401);
  });

  it('refuses a malformed refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'nonsense' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when no refresh token is supplied', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('requires authentication, so one caller cannot log another out', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(401);
  });

  it('succeeds with a valid token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({ refreshToken: login.body.data.refreshToken });
    expect(res.status).toBe(200);
  });
});
