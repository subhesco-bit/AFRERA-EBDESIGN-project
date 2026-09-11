'use strict';

/**
 * Stable canonical mount for the generated/bespoke backend module bridge.
 *
 * DynamicRouteLoader converts this filename to /api/v1/backend-modules,
 * which is the public contract used by module pages and API clients.
 * The implementation is intentionally delegated to the single bridge so
 * module operations are never duplicated or replaced with success stubs.
 */
module.exports = require('./claude/backendModuleBridge');
