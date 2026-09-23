/**
 * Auth route contract.
 *
 * UPDATED 2026-09-23. This suite was written against the mock router that used
 * to live in routes/authRoutes.js -- process-local `Map` users, plaintext
 * passwords, `jwt_<id>_<ts>` tokens -- and three of its expectations encoded
 * that mock's behaviour rather than a correct one:
 *
 *   - logout returned 200 for `Bearer test_token`, a string the real verifier
 *     rejects. It is 401 now, and that is the point: logout must not act on an
 *     unverified caller.
 *   - refresh accepted an ACCESS token and minted a new one. Only a refresh
 *     token works now.
 *   - registration reused fixed emails against what is now a persistent store,
 *     so a second run of the suite saw 409. Emails are unique per run and the
 *     store is a temp file, so the suite no longer depends on its own history.
 *
 * The deeper behavioural suite is routes/__tests__/authRoutes.test.js; this one
 * covers the original contract so the change in it stays visible.
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

// Must precede the authService require: the store path is read at module scope.
const TEMP_STORE = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), 'afrera-authroutes-')),
  'auth_store.json',
);
process.env.AUTH_STORE_PATH = TEMP_STORE;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-jwt-secret-for-jest';
process.env.PG_PORT = '59999'; // force the fallback store, whatever is listening

const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

const RUN = Date.now();
const email = (label) => `${label}-${RUN}@example.com`;

afterAll(() => {
  fs.rmSync(path.dirname(TEMP_STORE), { recursive: true, force: true });
});

describe('Auth Routes', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: email('john'),
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(email('john'));
    });

    it('should fail if email is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail if user already exists', async () => {
      // First registration
      await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: email('duplicate'),
          password: 'password123',
        });

      // Second registration with same email
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Jane Doe',
          email: email('duplicate'),
          password: 'password456',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: email('test'),
          password: 'testpass123',
        });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: email('test'),
          password: 'testpass123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(email('test'));
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: email('test'),
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail if email does not exist', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: email('nonexistent'),
          password: 'anypassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    it('rejects an unverifiable token instead of reporting success', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer test_token');

      // The mock this replaced returned 200 here. `test_token` is not a signed
      // JWT, so logging anyone out on the strength of it was never right.
      expect(response.status).toBe(401);
    });

    it('logs out a caller holding a real token', async () => {
      const registered = await request(app)
        .post('/auth/register')
        .send({ email: email('logout'), password: 'password123' });

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${registered.body.data.accessToken}`)
        .send({ refreshToken: registered.body.data.refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token', async () => {
      // Register to get a valid token
      const registerRes = await request(app)
        .post('/auth/register')
        .send({
          name: 'Refresh Test',
          email: email('refresh'),
          password: 'pass123',
        });

      // The mock returned a new token for whatever string it was given. Only a
      // REFRESH token is accepted now, so that is what is sent.
      const refreshToken = registerRes.body.data.refreshToken;

      const response = await request(app)
        .post('/auth/refresh')
        .send({ token: refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.token).not.toBe(refreshToken);
    });

    it('refuses an access token presented as a refresh token', async () => {
      const registered = await request(app)
        .post('/auth/register')
        .send({ email: email('accesstoken'), password: 'password123' });

      const response = await request(app)
        .post('/auth/refresh')
        .send({ token: registered.body.data.accessToken });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ token: 'invalid_token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
