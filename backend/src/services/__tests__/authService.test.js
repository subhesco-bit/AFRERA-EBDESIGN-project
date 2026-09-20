const authService = require('../dual-use/authService');

// 2026-09-20: found via the service-to-service call-resolution audit. This
// file was written against a simpler, generic auth API
// (validateCredentials(email, password) -> {valid, error};
// generateToken({userId, role})) that the real service -- a more
// sophisticated OAuth/2FA/refresh-token-capable implementation -- never had.
// The real equivalents (loginUser, generateAccessToken) exist but are not
// drop-in compatible: generateAccessToken(user) requires user.id (not
// userId) and does a real DB-backed permission lookup via user.role;
// loginUser does a real bcrypt+DB credential check, not a synchronous
// format-validation helper. Renaming the real service's methods to match
// this test, or aliasing them, would either break real callers or crash on
// the field-name mismatch. validateCredentials/generateToken sub-tests are
// skipped with this documented reason rather than fabricated as passing;
// hashPassword/comparePassword (real, exported this session) and
// verifyToken (already real) are left active since they test real,
// compatible behavior.
describe('AuthService', () => {
  describe.skip('validateCredentials (real API is loginUser, not drop-in compatible - see file header)', () => {
    it('should validate correct credentials', async () => {
      const result = await authService.validateCredentials('user@example.com', 'password123');
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
    });

    it('should reject invalid email', async () => {
      const result = await authService.validateCredentials('invalid-email', 'password');
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/email/i);
    });

    it('should reject short password', async () => {
      const result = await authService.validateCredentials('user@example.com', 'short');
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/password/i);
    });
  });

  describe.skip('generateToken (real API is generateAccessToken(user) with user.id, not drop-in compatible - see file header)', () => {
    it('should generate valid JWT token', () => {
      const token = authService.generateToken({ userId: 1, role: 'farmer' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include user data in token', () => {
      const userData = { userId: 42, role: 'admin' };
      const token = authService.generateToken(userData);
      const decoded = authService.verifyToken(token);
      expect(decoded.userId).toBe(userData.userId);
      expect(decoded.role).toBe(userData.role);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      // Uses the real generateAccessToken(user) API (user.id, not userId) -
      // rewritten from generateToken({userId: 1}), which doesn't exist.
      const token = authService.generateAccessToken({ id: 1, email: 'user@example.com', role: 'farmer' });
      const decoded = authService.verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(1);
    });

    it('should reject invalid token', () => {
      expect(() => authService.verifyToken('invalid.token.here')).toThrow();
    });

    it('should reject expired token', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MjA0MDAwMDB9.invalid';
      expect(() => authService.verifyToken(expiredToken)).toThrow();
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'secure_password_123';
      const hash = await authService.hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should produce different hash for same password', async () => {
      const password = 'test_password';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should match correct password', async () => {
      const password = 'test_password';
      const hash = await authService.hashPassword(password);
      const match = await authService.comparePassword(password, hash);
      expect(match).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'test_password';
      const hash = await authService.hashPassword(password);
      const match = await authService.comparePassword('wrong_password', hash);
      expect(match).toBe(false);
    });
  });
});
