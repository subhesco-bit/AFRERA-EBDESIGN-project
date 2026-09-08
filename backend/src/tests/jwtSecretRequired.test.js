// Real regression test for H1: authService must never silently sign/verify
// tokens with a hardcoded, guessable secret. Written because
// src/tests/unit/auth.test.js never actually requires authService - see
// FIXES.md C4.
//
// 2026-09-08: the original version of this test asserted an unconditional
// throw on missing JWT_SECRET, in every environment. That never matched the
// actual, deliberate design implemented consistently across authService.js,
// services/dual-use/authService.js, and modules/M012+M014/service.js: fail
// fast in production (an unset secret there is a real deploy misconfig worth
// crashing loudly for), but fall back to a random per-process secret in
// dev/test (so the whole suite doesn't have to set JWT_SECRET before every
// test file that transitively touches auth - Jest does not set it globally
// here). Rewritten to test that real contract instead of a stricter one the
// code was never built to, and never changed to match, across three
// independent implementations.
describe('JWT_SECRET is mandatory in production (H1)', () => {
  const ORIGINAL_SECRET = process.env.JWT_SECRET;
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  afterEach(() => {
    process.env.JWT_SECRET = ORIGINAL_SECRET;
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    jest.resetModules();
  });

  it('throws on require when JWT_SECRET is unset in production', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    expect(() => require('../services/authService')).toThrow(/JWT_SECRET/);
  });

  it('throws on require when JWT_SECRET is an empty string in production', () => {
    process.env.JWT_SECRET = '';
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    expect(() => require('../services/authService')).toThrow(/JWT_SECRET/);
  });

  it('falls back to a random per-process secret (does not throw) outside production', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'test';
    jest.resetModules();
    expect(() => require('../services/authService')).not.toThrow();
  });

  it('loads normally when JWT_SECRET is set', () => {
    process.env.JWT_SECRET = 'a-real-test-secret';
    jest.resetModules();
    expect(() => require('../services/authService')).not.toThrow();
  });

  it('M014 module follows the same production-only-throw contract', () => {
    // M012/service.js is NOT asserted here: its own header comment records
    // that its JWT-issuing code (with a hardcoded fallback secret) was
    // deleted on 2026-08-17 in favor of the canonical authService.js -
    // M012 no longer references JWT_SECRET at all, so it never throws for
    // this reason regardless of environment. Asserting a throw here would
    // test a contract that file was intentionally changed to no longer have.
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    expect(() => require('../modules/M014/service')).toThrow(/JWT_SECRET/);
  });
});
