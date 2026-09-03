const authService = require('../authService');

describe('AuthService', () => {
  describe('validateCredentials', () => {
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

  describe('generateToken', () => {
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
      const token = authService.generateToken({ userId: 1 });
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
