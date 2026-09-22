/** Contract tests for the current dual-use authentication service. */

jest.mock('../database/connection', () => ({
  getPostgreSQL: jest.fn(() => null),
}));

const authService = require('../services/dual-use/authService');

describe('dual-use auth service', () => {
  test('hashes and compares passwords', async () => {
    const password = 'SecurePass123!';
    const hash = await authService.hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await authService.comparePassword(password, hash)).toBe(true);
    expect(await authService.comparePassword('wrong-password', hash)).toBe(false);
  });

  test('creates and verifies access tokens', () => {
    const token = authService.generateAccessToken({ id: 'user-123', email: 'farmer@test.com', role: 'farmer' });

    expect(authService.verifyToken(token)).toMatchObject({ userId: 'user-123', email: 'farmer@test.com' });
  });

  test('creates refresh tokens with refresh type', () => {
    const token = authService.generateRefreshToken({ id: 'user-123' });

    expect(authService.verifyToken(token)).toMatchObject({ userId: 'user-123', tokenType: 'refresh' });
  });

  test('rejects tampered tokens', () => {
    const token = authService.generateAccessToken({ id: 'user-123', email: 'farmer@test.com', role: 'farmer' });

    expect(() => authService.verifyToken(`${token.slice(0, -10)}0000000000`)).toThrow('Invalid token');
  });

  test('applies role permissions and wildcard access', () => {
    expect(authService.hasPermission(['*'], 'anything')).toBe(true);
    expect(authService.hasPermission(['marketplace:read'], 'marketplace:read')).toBe(true);
    expect(authService.hasPermission(['marketplace:read'], 'admin:write')).toBe(false);
  });

  test('rejects malformed two-factor codes', () => {
    expect(authService.verifyTOTPCode('', '000000')).toBe(false);
    expect(authService.verifyTOTPCode('JBSWY3DPEBLW64TMMQ', 'not-a-code')).toBe(false);
  });

  test('exports the current authentication router endpoints', () => {
    expect(typeof authService.router).toBe('function');
    const paths = authService.router.stack
      .filter((layer) => layer.route)
      .map((layer) => layer.route.path);

    expect(paths).toEqual(expect.arrayContaining(['/register', '/login', '/refresh', '/me']));
  });
});