'use strict';
/** Fail-closed dev-user guard. Faithfully ported from pine-shadow's
 * src/lib/auth/verify.server.ts (requireUserId / DEV_USER_ID / the
 * databaseConfigured-but-auth-disabled check) -- the one genuinely
 * portable, framework-agnostic security principle inside pine-shadow's
 * otherwise Grok-sandbox-platform-specific auth/ directory (Better Auth,
 * TanStack Start, `*.grok.me` sibling isolation, OAuth broker federation
 * -- none of which apply to this project and were correctly left
 * unported; see the top of index.js for the full reasoning).
 *
 * The principle, in pine-shadow's own words: "Auth disabled + DATABASE_URL
 * set -> throw (fail closed): one shared dev user on a real database
 * would let every visitor read/write everyone's rows." This is a real,
 * generically valuable invariant independent of Better Auth or TanStack,
 * and is reusable by this project's actual authentication system if it
 * ever wants it -- it is NOT wired into any live route here, consistent
 * with CLAUDE.md's "Authentication/authorization logic: DO NOT CHANGE". */

const DEV_USER_ID = 'dev-user';

class AuthBypassRefusedError extends Error {
  constructor() {
    super('Auth is disabled but a real database is configured — refusing to fall back to a shared dev user against production data.');
    this.name = 'AuthBypassRefusedError';
    this.status = 500;
  }
}

/**
 * Resolve the id to use when a route's auth check is bypassed (e.g. a
 * local-dev "auth off" mode). Throws instead of returning a shared dev
 * user id when a real database connection is configured, so a dev-mode
 * shortcut can never silently run multi-tenant against production data.
 *
 * @param {object} opts
 * @param {boolean} opts.authEnabled - whether real auth is configured/enforced
 * @param {boolean} opts.databaseConfigured - whether a real (non-dev) DB is connected
 * @returns {string} the dev user id, only when it is safe to use one
 */
function resolveDevUserId({ authEnabled, databaseConfigured }) {
  if (authEnabled) {
    throw new Error('resolveDevUserId() is only for the auth-disabled path; auth is enabled.');
  }
  if (databaseConfigured) {
    throw new AuthBypassRefusedError();
  }
  return DEV_USER_ID;
}

module.exports = { DEV_USER_ID, AuthBypassRefusedError, resolveDevUserId };
