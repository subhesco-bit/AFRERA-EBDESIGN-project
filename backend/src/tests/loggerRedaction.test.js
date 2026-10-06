const { redactSensitiveData } = require('../utils/logger');

describe('logger secret redaction', () => {
  test('redacts common provider secrets and bearer tokens', () => {
    const value = redactSensitiveData(
      'OPENAI_API_KEY=sk-live-example Bearer eyJhbGciOiJIUzI1NiJ9.secret.signature',
    );

    expect(value).not.toContain('sk-live-example');
    expect(value).not.toContain('eyJhbGciOiJIUzI1NiJ9.secret.signature');
    expect(value).toContain('PROVIDER_SECRET=***REDACTED***');
    expect(value).toContain('Bearer ***REDACTED***');
  });

  test('redacts six-digit OTP values', () => {
    expect(redactSensitiveData('verification OTP 481205')).toContain('***OTP***');
  });
});

describe('logger metadata redaction', () => {
  const { logger, redactMetadata } = require('../utils/logger');

  test('logging metadata containing 6-digit numbers does not throw', () => {
    // Regression: the JSON log format used to re-parse regex-redacted JSON,
    // and `"interval":300000` became invalid JSON, throwing inside the logger.
    expect(() => logger.info('config loaded', { interval: 300000, password: 'p"w' })).not.toThrow();
  });

  test('redacts sensitive keys and nested string values structurally', () => {
    const out = redactMetadata({
      password: 'hunter2',
      nested: { token: 'abc', note: 'OTP 481205', count: 123456 },
      list: ['Bearer abc.def.ghi'],
    });
    expect(out.password).toBe('***REDACTED***');
    expect(out.nested.token).toBe('***REDACTED***');
    expect(out.nested.note).toContain('***OTP***');
    expect(out.nested.count).toBe(123456);
    expect(out.list[0]).toBe('Bearer ***REDACTED***');
  });
});
