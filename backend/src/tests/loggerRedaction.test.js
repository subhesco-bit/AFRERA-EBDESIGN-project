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
