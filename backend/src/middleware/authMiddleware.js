// Compatibility wrapper for auth middleware
//
// (2026-09-16) 314 of the 344 routes.js files in backend/src/modules/
// (the same generated M0xx scaffold) do
// `const { authenticate, authorize } = require('../../middleware/authMiddleware')`
// then `router.use(authenticate)` - a real, load-bearing call, not a
// dead import (unlike `authorize`, which grepped zero actual call sites
// across all 344 files and is left unaliased here). `./auth` only
// exports `authMiddleware` under that name, so `authenticate` was
// destructured as undefined and every one of those modules crashed at
// require() time with "Router.use() requires a middleware function".
// Aliasing the same real middleware function under the name this
// scaffold expects fixes the crash without duplicating any auth logic.
// auth.js's own module.exports is itself a callable function
// (Object.assign(authMiddleware, {...})) - 3 existing route files
// (infrastructureMonitoringRoutes.js, gdprComplianceRoutes.js,
// aiTrainingEvaluationRoutes.js) already depend on
// `require('../middleware/authMiddleware')` being directly usable as
// `router.use(authMiddleware)`, not just a plain properties object, so
// this mutates the same object in place rather than wrapping it in a
// new plain object (which would break those 3 call sites the same way
// this file was just breaking the M0xx scaffold).
const auth = require('./auth');
auth.authenticate = auth.authMiddleware;
module.exports = auth;
