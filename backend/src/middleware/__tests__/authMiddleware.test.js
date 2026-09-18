'use strict';

// middleware/authMiddleware.js is a compatibility wrapper around
// middleware/auth.js. 314 of the 344 generated modules/M0xx/routes.js
// files do `const { authenticate } = require('../../middleware/authMiddleware')`
// then `router.use(authenticate)` - a real, load-bearing call - but
// auth.js only ever exported the same function under the name
// `authMiddleware`, so `authenticate` was undefined and every one of
// those 314 modules crashed at require() time with "Router.use()
// requires a middleware function". Fixed (2026-09-16) by aliasing the
// same real function under both names. Separately, 3 existing route
// files (infrastructureMonitoringRoutes.js, gdprComplianceRoutes.js,
// aiTrainingEvaluationRoutes.js) already depended on
// `require('../middleware/authMiddleware')` being directly callable as
// `router.use(authMiddleware)` - not just an object of named exports -
// so the fix mutates the existing auth.js export in place rather than
// wrapping it in a new plain object, which would have broken those 3
// call sites the same way this file was breaking the M0xx scaffold.

describe('middleware/authMiddleware.js - authenticate alias fix', () => {
  test('is still directly callable as middleware (existing router.use(authMiddleware) call sites)', () => {
    const authMiddleware = require('../authMiddleware');
    expect(typeof authMiddleware).toBe('function');
  });

  test('also exports an authenticate alias pointing at the same function (M0xx scaffold expectation)', () => {
    const authMiddleware = require('../authMiddleware');
    expect(typeof authMiddleware.authenticate).toBe('function');
    expect(authMiddleware.authenticate).toBe(authMiddleware.authMiddleware);
  });
});
