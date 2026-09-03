const {
  rateLimit,
  validateInput,
  validatePassword,
  validateEmail,
  validateSQLInput,
} = require('../middleware/securityMiddleware');

describe('Security Middleware', () => {
  describe('Rate Limiting', () => {
    it('should allow requests within limit', (done) => {
      const middleware = rateLimit(5, 60000);
      const req = { ip: '127.0.0.1' };
      const res = { status: () => ({ json: () => {} }) };
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      done();
    });

    it('should block requests exceeding limit', (done) => {
      const middleware = rateLimit(2, 60000);
      const req1 = { ip: '192.168.1.1' };
      const req2 = { ip: '192.168.1.1' };
      const req3 = { ip: '192.168.1.1' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      middleware(req1, res, next);
      middleware(req2, res, next);
      middleware(req3, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      done();
    });
  });

  describe('Input Validation', () => {
    it('should remove HTML tags from input', () => {
      const req = { body: { name: '<script>alert("xss")</script>' } };
      const res = {};
      const next = jest.fn();

      validateInput(req, res, next);

      expect(req.body.name).not.toContain('<');
      expect(req.body.name).not.toContain('>');
      expect(next).toHaveBeenCalled();
    });

    it('should remove quotes from input', () => {
      const req = { body: { email: 'test@example.com"; DROP TABLE users;' } };
      const res = {};
      const next = jest.fn();

      validateInput(req, res, next);

      expect(req.body.email).not.toContain('"');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Password Validation', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('Password1')).toBe(true);
      expect(validatePassword('MyPass123')).toBe(true);
    });

    it('should reject passwords without uppercase', () => {
      expect(validatePassword('password123')).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      expect(validatePassword('Password')).toBe(false);
    });

    it('should reject short passwords', () => {
      expect(validatePassword('Pass1')).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('john.doe@company.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should reject SQL keywords', () => {
      expect(validateSQLInput("'; DROP TABLE users; --")).toBe(false);
      expect(validateSQLInput('1 UNION SELECT * FROM users')).toBe(false);
      expect(validateSQLInput('value; DELETE FROM accounts')).toBe(false);
    });

    it('should accept safe inputs', () => {
      expect(validateSQLInput('John Doe')).toBe(true);
      expect(validateSQLInput('user@example.com')).toBe(true);
      expect(validateSQLInput('normal input text')).toBe(true);
    });
  });
});
