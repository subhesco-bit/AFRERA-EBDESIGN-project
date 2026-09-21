/**
 * Auth Service Tests (M002 User Management + M026 MFA)
 * Comprehensive test coverage for authentication system
 * Tests: login, register, 2FA, JWT validation, OAuth, password reset
 */

const authService = require('../services/dual-use/authService');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

describe('Auth Service (M002 + M026)', () => {

  // Mock database
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {

    test('should register new user with valid credentials', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          email: 'farmer@test.com',
          phone: '+919876543210',
          created_at: new Date()
        }]
      });

      const result = await authService.register('farmer@test.com', 'SecurePass123!', '+919876543210');

      expect(result).toHaveProperty('id');
      expect(result.email).toBe('farmer@test.com');
      expect(mockPool.query).toHaveBeenCalled();
    });

    test('should reject weak password', async () => {
      const weakPasswords = ['123', 'password', 'abc123'];

      for (const pwd of weakPasswords) {
        expect(() => authService.validatePassword(pwd)).toThrow();
      }
    });

    test('should reject duplicate email', async () => {
      mockPool.query.mockRejectedValueOnce({
        code: '23505', // PostgreSQL unique violation
        message: 'duplicate email'
      });

      await expect(authService.register('dup@test.com', 'SecurePass123!', '+919876543210'))
        .rejects.toThrow();
    });

    test('should hash password with bcrypt', async () => {
      const password = 'SecurePass123!';
      const hashed = await authService.hashPassword(password);

      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(20);
      expect(await authService.comparePasswords(password, hashed)).toBe(true);
    });
  });

  describe('User Login', () => {

    test('should login with correct credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'farmer@test.com',
        password_hash: '$2b$10$mock_bcrypt_hash',
        mfa_enabled: false
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await authService.login('farmer@test.com', 'CorrectPassword123!');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
    });

    test('should reject invalid password', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          password_hash: '$2b$10$wrong_hash'
        }]
      });

      await expect(authService.login('farmer@test.com', 'WrongPassword'))
        .rejects.toThrow('Invalid credentials');
    });

    test('should reject nonexistent user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(authService.login('nonexistent@test.com', 'Password123!'))
        .rejects.toThrow();
    });

    test('should implement rate limiting (5 req/60s)', async () => {
      const rateLimiter = authService.getRateLimiter('login');

      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.checkLimit('farmer@test.com')).toBe(true);
      }

      // 6th attempt should fail
      expect(rateLimiter.checkLimit('farmer@test.com')).toBe(false);
    });
  });

  describe('JWT Token Management', () => {

    const mockPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds...
-----END RSA PRIVATE KEY-----`;

    test('should create valid JWT token', () => {
      const token = authService.createJWT({
        userId: 'user-123',
        email: 'farmer@test.com'
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT structure
    });

    test('should validate JWT token', () => {
      const payload = { userId: 'user-123', email: 'farmer@test.com' };
      const token = authService.createJWT(payload);

      const decoded = authService.verifyJWT(token);
      expect(decoded.userId).toBe('user-123');
      expect(decoded.email).toBe('farmer@test.com');
    });

    test('should reject expired token', () => {
      // Create expired token with 0s expiry
      const expiredToken = authService.createJWT({ userId: 'user-123' }, '0s');

      expect(() => authService.verifyJWT(expiredToken))
        .toThrow('Token expired');
    });

    test('should reject tampered token', () => {
      const token = authService.createJWT({ userId: 'user-123' });
      const tampered = token.slice(0, -10) + '0000000000';

      expect(() => authService.verifyJWT(tampered))
        .toThrow();
    });

    test('should issue refresh token for token rotation', async () => {
      const accessToken = authService.createJWT({ userId: 'user-123' }, '15m');
      const refreshToken = authService.createRefreshToken({ userId: 'user-123' });

      expect(refreshToken).toBeDefined();
      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('Two-Factor Authentication (M026)', () => {

    test('should setup TOTP 2FA', async () => {
      const setup = await authService.setupTwoFactor('user-123', 'TOTP');

      expect(setup).toHaveProperty('secret');
      expect(setup).toHaveProperty('qrCode');
      expect(setup.secret.length).toBeGreaterThan(20);
    });

    test('should verify TOTP code', async () => {
      const secret = 'JBSWY3DPEBLW64TMMQ======'; // Test secret
      const code = authService.generateTOTPCode(secret);

      const verified = authService.verifyTOTPCode(secret, code);
      expect(verified).toBe(true);
    });

    test('should reject invalid TOTP code', async () => {
      const secret = 'JBSWY3DPEBLW64TMMQ======';
      const verified = authService.verifyTOTPCode(secret, '000000');

      expect(verified).toBe(false);
    });

    test('should setup SMS 2FA', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'sms-setup-123', created_at: new Date() }]
      });

      const setup = await authService.setupTwoFactor('user-123', 'SMS');
      expect(setup).toHaveProperty('phone');
      expect(setup).toHaveProperty('verificationSent');
    });

    test('should verify SMS code', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ code: '123456', created_at: new Date() }]
      });

      const verified = await authService.verifySMSCode('user-123', '123456');
      expect(verified).toBe(true);
    });

    test('should disable 2FA', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await authService.disableTwoFactor('user-123');
      expect(result).toBe(true);
    });
  });

  describe('OAuth Integration', () => {

    test('should generate OAuth authorization URL', () => {
      const url = authService.getOAuthURL('google');

      expect(url).toContain('https://accounts.google.com');
      expect(url).toContain('client_id');
      expect(url).toContain('redirect_uri');
      expect(url).toContain('scope');
    });

    test('should exchange OAuth code for tokens', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'oauth-user-123',
          oauth_provider: 'google',
          oauth_id: 'google-123'
        }]
      });

      const result = await authService.handleOAuthCallback('google', 'auth-code-123');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });

    test('should link OAuth to existing account', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await authService.linkOAuthProvider('user-123', 'github', 'github-user-456');
      expect(result).toBe(true);
    });
  });

  describe('Password Reset', () => {

    test('should generate password reset token', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ reset_token: 'reset-token-123', expires_at: new Date() }]
      });

      const result = await authService.requestPasswordReset('farmer@test.com');
      expect(result).toHaveProperty('resetToken');
      expect(result).toHaveProperty('expiresIn');
    });

    test('should validate reset token', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          user_id: 'user-123',
          expires_at: new Date(Date.now() + 3600000) // 1 hour from now
        }]
      });

      const valid = await authService.verifyResetToken('reset-token-123');
      expect(valid).toBe(true);
    });

    test('should reject expired reset token', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          user_id: 'user-123',
          expires_at: new Date(Date.now() - 1000) // 1 second ago
        }]
      });

      const valid = await authService.verifyResetToken('expired-token');
      expect(valid).toBe(false);
    });

    test('should complete password reset', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await authService.completePasswordReset('reset-token-123', 'NewPassword123!');
      expect(result).toBe(true);
    });
  });

  describe('Logout & Session Revocation', () => {

    test('should logout user and revoke session', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await authService.logout('user-123');
      expect(result).toBe(true);
    });

    test('should revoke all sessions for user', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 5 });

      const result = await authService.revokeAllSessions('user-123');
      expect(result).toBe(true);
    });

    test('should invalidate refresh token', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await authService.revokeRefreshToken('refresh-token-123');
      expect(result).toBe(true);
    });
  });

  describe('Security Audit Trail', () => {

    test('should log authentication events', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const events = [
        { type: 'LOGIN_SUCCESS', userId: 'user-123' },
        { type: 'LOGIN_FAILURE', email: 'test@test.com', reason: 'invalid_password' },
        { type: 'MFA_SETUP', userId: 'user-123', method: 'TOTP' },
        { type: 'PASSWORD_RESET', userId: 'user-123' }
      ];

      for (const event of events) {
        await authService.logSecurityEvent(event);
        expect(mockPool.query).toHaveBeenCalled();
      }
    });

    test('should track brute force attempts', async () => {
      const tracker = authService.getBruteForceTracker();

      for (let i = 0; i < 5; i++) {
        tracker.recordAttempt('attacker@evil.com');
      }

      const blocked = tracker.isBlocked('attacker@evil.com');
      expect(blocked).toBe(true);
    });
  });

  describe('User Profile (/me endpoint)', () => {

    test('should return current user profile', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          email: 'farmer@test.com',
          phone: '+919876543210',
          name: 'Ram Kumar',
          mfa_enabled: true,
          created_at: new Date()
        }]
      });

      const profile = await authService.getUserProfile('user-123');

      expect(profile.id).toBe('user-123');
      expect(profile.email).toBe('farmer@test.com');
      expect(profile.mfa_enabled).toBe(true);
    });

    test('should update user profile', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'user-123', name: 'Ram Kumar Updated' }]
      });

      const result = await authService.updateUserProfile('user-123', { name: 'Ram Kumar Updated' });
      expect(result.name).toBe('Ram Kumar Updated');
    });
  });

  describe('Database Connection Validation', () => {

    test('should validate database pool configuration', () => {
      const config = authService.getPoolConfig();

      expect(config).toHaveProperty('host');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('user');
    });

    test('should handle database connection errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Connection refused'));

      expect(async () => {
        await authService.login('test@test.com', 'password');
      }).rejects.toThrow();
    });
  });

  describe('Edge Cases & Security', () => {

    test('should not expose password in response', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-123',
          email: 'test@test.com',
          password_hash: 'should_not_be_here'
        }]
      });

      const profile = await authService.getUserProfile('user-123');

      expect(profile).not.toHaveProperty('password_hash');
      expect(profile).not.toHaveProperty('password');
    });

    test('should sanitize email input', async () => {
      const maliciousEmail = `'; DROP TABLE users; --`;

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(authService.login(maliciousEmail, 'password'))
        .rejects.toThrow();

      // Verify escaped query was used
      const callArgs = mockPool.query.mock.calls[0];
      expect(callArgs[1]).toContain(maliciousEmail); // Should be in params, not SQL
    });

    test('should limit session duration', async () => {
      const token = authService.createJWT({ userId: 'user-123' }, '15m');
      const decoded = jwt.decode(token);

      expect(decoded.exp - decoded.iat).toBe(900); // 15 minutes in seconds
    });

    test('should enforce HTTPS in production', () => {
      process.env.NODE_ENV = 'production';

      expect(() => {
        authService.validateSecurityConfig();
      }).not.toThrow();
    });
  });
});

describe('Auth Middleware', () => {

  test('should extract token from Authorization header', () => {
    const req = {
      headers: {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    };

    const token = authService.extractToken(req);
    expect(token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  });

  test('should reject request without token', () => {
    const req = { headers: {} };

    expect(() => authService.extractToken(req))
      .toThrow('No authorization token');
  });

  test('should validate token in middleware', async () => {
    const validToken = authService.createJWT({ userId: 'user-123' });
    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = {};
    const next = jest.fn();

    await authService.authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toHaveProperty('userId');
  });
});

describe('Performance & Load Tests', () => {

  test('should handle concurrent login requests', async () => {
    const requests = Array(10).fill(null).map(() =>
      authService.login('farmer@test.com', 'Password123!')
        .catch(e => ({ error: e.message }))
    );

    const results = await Promise.all(requests);

    // Verify rate limiting kicked in
    const successful = results.filter(r => r.access_token).length;
    const limited = results.filter(r => r.error).length;

    expect(successful + limited).toBe(10);
    expect(limited).toBeGreaterThan(0); // Some should hit rate limit
  });

  test('should encrypt/decrypt passwords efficiently', async () => {
    const password = 'SuperSecurePassword123!';
    const start = Date.now();

    const hashed = await authService.hashPassword(password);
    const hashTime = Date.now() - start;

    expect(hashTime).toBeLessThan(1000); // Should complete in <1 second
    expect(await authService.comparePasswords(password, hashed)).toBe(true);
  });
});
