const {
  rateLimit,
  validateInput,
  validatePassword,
  validateEmail,
  validateSQLInput,
  securityHeaders,
  errorHandler,
} = require('../middleware/securityMiddleware');

describe('Security Middleware', () => {
  describe('Rate Limiting', () => {
    it('allows requests within limit and sets retry metadata only when blocked', () => {
      const middleware = rateLimit(2, 60000);
      const req = { ip: '127.0.0.1' };
      const res = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      };
      const next = jest.fn();

      middleware(req, res, next);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(2);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('blocks requests exceeding limit with Retry-After', () => {
      const middleware = rateLimit(2, 60000);
      const req = { ip: '192.168.1.1' };
      const res = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        json: jest.fn(),
      };
      const next = jest.fn();

      middleware(req, res, next);
      middleware(req, res, next);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '60');
    });
  });

  describe('Input Validation Compatibility', () => {
    it('does not mutate business input', () => {
      const body = { name: '<script>alert("xss")</script>', description: 'salt; select' };
      const req = { body };
      const next = jest.fn();

      validateInput(req, {}, next);

      expect(req.body).toBe(body);
      expect(req.body.name).toContain('<script>');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Password Validation', () => {
    it('accepts a strong password', () => {
      expect(validatePassword('StrongPassword1!')).toBe(true);
    });

    it('rejects passwords without uppercase, number, or symbol', () => {
      expect(validatePassword('passwordpassword')).toBe(false);
    });

    it('rejects short passwords', () => {
      expect(validatePassword('Pass1!')).toBe(false);
    });

    it('rejects non-string values', () => {
      expect(validatePassword(null)).toBe(false);
      expect(validatePassword({})).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('accepts valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('john.doe@company.co.uk')).toBe(true);
    });

    it('rejects invalid or oversized emails', () => {
      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('a'.repeat(255) + '@example.com')).toBe(false);
    });
  });

  describe('SQL Input Contract', () => {
    it('does not reject legitimate business words', () => {
      expect(validateSQLInput('update schedule')).toBe(true);
      expect(validateSQLInput('select variety')).toBe(true);
      expect(validateSQLInput('normal input text')).toBe(true);
    });

    it('rejects NUL bytes', () => {
      expect(validateSQLInput('safe\0value')).toBe(false);
    });
  });

  describe('Security Headers', () => {
    it('sets core browser security headers', () => {
      const headers = {};
      const req = { secure: true, path: '/api/orders' };
      const res = {
        setHeader: jest.fn((name, value) => { headers[name] = value; }),
        removeHeader: jest.fn(),
      };
      const next = jest.fn();

      securityHeaders(req, res, next);

      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Error Handler', () => {
    it('does not expose internal error details for server errors', () => {
      const res = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const req = { id: 'request-123' };

      errorHandler(new Error('database password leaked'), req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Internal Server Error',
        requestId: 'request-123',
      }));
    });
  });
});
