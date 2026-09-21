/**
 * Compatibility shim for the modules/M0xx routes.js scaffold.
 *
 * (2026-09-16) Every routes.js in backend/src/modules/ (344 files, same
 * generated template) does
 * `const { validateRequest } = require('../../middleware/validationMiddleware')` -
 * this file never existed, so every module threw `Cannot find module`
 * at require() time. Verified `validateRequest(...)` is never actually
 * called as middleware in any of the 344 routes.js files (grepped for
 * `validateRequest(` - zero matches) - it's a dead import everywhere,
 * same class of bug as the sharedInfrastructureAPI dead-import found
 * earlier this session. Providing a real, correct pass-through
 * middleware here (rather than leaving the require broken) fixes the
 * crash without deleting the unused import from 344 files individually.
 */

'use strict';

function validateRequest(schema) {
  return function (req, res, next) {
    next();
  };
}

module.exports = { validateRequest };
