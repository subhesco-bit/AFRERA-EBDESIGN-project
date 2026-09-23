'use strict';
/** DEEP-ANALYSIS RESOLUTION (verified by reading pine-shadow's real
 * src/lib/auth/ source, all 17 files, not assumed):
 *
 * Pine-shadow's auth/ is NOT AFRERA business logic and has no "doctrine"
 * comparable to erp/, body/, brain/, vet/, lattice/, os/. It is OAuth
 * federation scaffolding for the "Grok" multi-tenant sandbox hosting
 * platform pine-shadow itself happens to run on: it federates sign-in to
 * a shared "Grok auth broker" (GROK_AUTH_ISSUER, providers.ts), uses
 * Better Auth + TanStack Start (server.ts, middleware.ts), issues
 * `__Host-` cookies scoped against MUTUALLY UNTRUSTED sibling apps on
 * `*.grok.me` (isolation.server.ts, gate-session.server.ts), and supports
 * a partitioned-iframe "live preview" bearer-token flow specific to that
 * platform's editor (popup.server.ts, preview.ts, pglite-dialect.ts).
 * None of that infrastructure -- or its npm dependencies (better-auth,
 * @tanstack/react-start) -- has any relationship to this project's real
 * deployment, so porting it verbatim would import unrelated third-party
 * SaaS wiring, not resolve a gap.
 *
 * Two pieces ARE genuine, framework-agnostic security logic independent
 * of that platform, and are faithfully ported here as real, working,
 * available (not auto-wired) utilities:
 *   - fail-closed.js: the dev-user-bypass-must-fail-closed-against-a-real-
 *     database invariant, from verify.server.ts's requireUserId().
 *   - same-site.js: Fetch-Metadata same-site request validation
 *     (Sec-Fetch-Site/-Mode/-Dest), from isolation.server.ts, re-platformed
 *     from TanStack's getRequest() to a plain Express req.
 *
 * provider.js/server.js/middleware.js below remain the earlier session's
 * fabricated generic EmailPasswordProvider/AuthServer scaffold -- kept
 * (not deleted) as independently-coherent, working example code, but they
 * are still not a pine-shadow port and should not be cited as one. This
 * project's own authentication system is unchanged, per CLAUDE.md's
 * "Authentication/authorization logic: DO NOT CHANGE" -- neither the real
 * ports nor the old scaffold are wired into any live route. */

const { AuthProvider, EmailPasswordProvider } = require('./provider');
const { AuthServer } = require('./server');
const { createAuthMiddleware, createGateMiddleware } = require('./middleware');
const { DEV_USER_ID, AuthBypassRefusedError, resolveDevUserId } = require('./fail-closed');
const { CrossSiteRequestError, isCrossSiteScriptedRequest, assertSameSiteRequest, sameSiteGuard } = require('./same-site');

// Singleton instance
let authServer = null;

function getAuthServer() {
  if (!authServer) authServer = new AuthServer();
  return authServer;
}

function initializeAuthServer(opts = {}) {
  authServer = new AuthServer(opts);
  return authServer;
}

module.exports = {
  AuthProvider,
  EmailPasswordProvider,
  AuthServer,
  createAuthMiddleware,
  createGateMiddleware,
  getAuthServer,
  initializeAuthServer,
  // Real pine-shadow ports:
  DEV_USER_ID,
  AuthBypassRefusedError,
  resolveDevUserId,
  CrossSiteRequestError,
  isCrossSiteScriptedRequest,
  assertSameSiteRequest,
  sameSiteGuard,
};
