jest.mock('../../database/connection', () => ({
  getPostgreSQL: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const { getPostgreSQL } = require('../../database/connection');
const authService = require('../dual-use/authService');

const originalNodeEnv = process.env.NODE_ENV;

describe('AuthService production security', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('forces public registration to consumer and pending', async () => {
    const query = jest.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 'user-1', email: 'new@example.com', phone: null, role: 'consumer', status: 'pending' }]
      })
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }] });
    getPostgreSQL.mockReturnValue({ query });

    const result = await authService.registerUser({
      email: 'new@example.com',
      password: 'secure-password',
      role: 'admin',
      status: 'active'
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      ['new@example.com', null, expect.any(String), 'consumer', 'pending']
    );
    expect(result.user.role).toBe('consumer');
    expect(result.user.status).toBe('pending');
  });

  it.each([
    ['registration', () => authService.registerUser({ email: 'new@example.com', password: 'secure-password' })],
    ['login', () => authService.loginUser('user@example.com', 'password')],
    ['refresh', () => authService.refreshAccessToken(authService.generateRefreshToken({ id: 'user-1' }))],
    ['logout', () => authService.logoutUser('user-1', 'refresh-token')]
  ])('fails closed for %s when PostgreSQL is unavailable in production', async (_operation, operation) => {
    process.env.NODE_ENV = 'production';
    getPostgreSQL.mockReturnValue(null);

    await expect(operation()).rejects.toThrow('Authentication service unavailable');
  });

  it('fails closed for current-user lookup when PostgreSQL is unavailable in production', async () => {
    const token = authService.generateAccessToken({ id: 'user-1', email: 'user@example.com', role: 'consumer' });
    process.env.NODE_ENV = 'production';
    getPostgreSQL.mockReturnValue(null);

    const app = express().use(authService.router);
    const response = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Authentication service unavailable');
  });
});
