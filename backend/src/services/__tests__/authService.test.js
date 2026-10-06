/**
 * Token handling in services/dual-use/authService.js.
 *
 * Rewritten 2026-10-05: the previous version (recovered in c39316f) called
 * validateCredentials/generateToken/hashPassword/comparePassword, none of
 * which this module has ever exported. These tests cover what it does
 * export: access/refresh token issuance, verification, and permission checks.
 */
const jwt = require('jsonwebtoken');
const authService = require('../dual-use/authService');

const user = { id: '11111111-1111-4111-8111-111111111111', email: 'farmer@example.com', role: 'farmer' };

describe('authService tokens', () => {
  test('access token round-trips user identity and role', () => {
    const token = authService.generateAccessToken(user);
    expect(token.split('.')).toHaveLength(3);
    const payload = authService.verifyToken(token);
    expect(payload.userId).toBe(user.id);
    expect(payload.email).toBe(user.email);
    expect(payload.role).toBe('farmer');
    expect(Array.isArray(payload.permissions)).toBe(true);
  });

  test('refresh token is marked as a refresh token', () => {
    const payload = authService.verifyToken(authService.generateRefreshToken(user));
    expect(payload.userId).toBe(user.id);
    expect(payload.tokenType).toBe('refresh');
  });

  test('rejects malformed tokens', () => {
    expect(() => authService.verifyToken('not-a-jwt')).toThrow('Invalid token');
  });

  test('rejects tokens signed with a different secret', () => {
    const forged = jwt.sign({ userId: user.id, role: 'admin' }, 'some-other-secret');
    expect(() => authService.verifyToken(forged)).toThrow('Invalid token');
  });

  test('rejects unsigned (alg: none) tokens', () => {
    const unsigned = jwt.sign({ userId: user.id, role: 'admin' }, null, { algorithm: 'none' });
    expect(() => authService.verifyToken(unsigned)).toThrow();
  });

  test('rejects expired tokens', () => {
    const expired = jwt.sign({ userId: user.id, exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);
    expect(() => authService.verifyToken(expired)).toThrow('Token expired');
  });
});

describe('authService.hasPermission', () => {
  test('grants a listed permission and denies an unlisted one', () => {
    expect(authService.hasPermission(['products:read'], 'products:read')).toBe(true);
    expect(authService.hasPermission(['products:read'], 'products:write')).toBe(false);
  });

  test('wildcard grants everything', () => {
    expect(authService.hasPermission(['*'], 'anything:at-all')).toBe(true);
  });
});
