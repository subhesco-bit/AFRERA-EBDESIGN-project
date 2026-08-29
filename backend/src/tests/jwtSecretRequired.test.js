// Real regression test for H1: authService must refuse to load without a
// real JWT_SECRET, rather than silently falling back to a hardcoded default.
// Written because src/tests/unit/auth.test.js never actually requires
// authService - see FIXES.md C4.
describe('JWT_SECRET is mandatory (H1)', () => {
  const ORIGINAL_SECRET = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = ORIGINAL_SECRET;
    jest.resetModules();
  });

  it('throws on require when JWT_SECRET is unset', () => {
    delete process.env.JWT_SECRET;
    jest.resetModules();
    expect(() => require('../services/authService')).toThrow(/JWT_SECRET/);
  });

  it('throws on require when JWT_SECRET is an empty string', () => {
    process.env.JWT_SECRET = '';
    jest.resetModules();
    expect(() => require('../services/authService')).toThrow(/JWT_SECRET/);
  });

  it('loads normally when JWT_SECRET is set', () => {
    process.env.JWT_SECRET = 'a-real-test-secret';
    jest.resetModules();
    expect(() => require('../services/authService')).not.toThrow();
  });

  it('M012 and M014 modules also refuse to load without JWT_SECRET', () => {
    delete process.env.JWT_SECRET;
    jest.resetModules();
    expect(() => require('../modules/M012/service')).toThrow(/JWT_SECRET/);
    jest.resetModules();
    expect(() => require('../modules/M014/service')).toThrow(/JWT_SECRET/);
  });
});
