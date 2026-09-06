const { corsMiddleware, rateLimit } = require('../middleware/securityMiddleware');

describe('security middleware', () => {
  test('allows only configured origins for credentialed requests', () => {
    const originalOrigin = process.env.CORS_ORIGIN;
    process.env.CORS_ORIGIN = 'https://app.example.com, https://admin.example.com';

    const response = {
      headers: {},
      header(name, value) {
        this.headers[name] = value;
      },
      sendStatus: jest.fn(),
    };
    const request = {
      get: name => name === 'Origin' ? 'https://untrusted.example.com' : undefined,
      method: 'GET',
    };

    corsMiddleware(request, response, jest.fn());

    expect(response.headers['Access-Control-Allow-Origin']).toBeUndefined();
    expect(response.headers['Access-Control-Allow-Methods']).toContain('GET');
    process.env.CORS_ORIGIN = originalOrigin;
  });

  test('returns 429 after the configured request limit', () => {
    const middleware = rateLimit(1, 60_000);
    const request = { ip: 'test-client' };
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    middleware(request, response, next);
    middleware(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(429);
  });
});
