'use strict';
/** STATUS: NOT a pine-shadow port. provider.js/server.js/middleware.js in
 * this directory were fabricated in an earlier session (invented generic
 * email/password provider classes) before pine-shadow's real source was
 * read. They were never rechecked against pine-shadow's actual src/lib/auth/
 * (15 files: client.ts, email-password.ts, gate-identity.server.ts,
 * gate-session.server.ts, gates.tsx, isolation.server.ts, middleware.ts,
 * pglite-dialect.ts, popup.server.ts, preview.ts, provider.tsx,
 * providers.ts, server.ts, sign-in-gate.ts, use-current-user.ts,
 * verify.server.ts), and should not be cited as one.
 *
 * This project already has its own authentication system (CLAUDE.md marks
 * "Authentication/authorization logic" as DO NOT CHANGE), so a verbatim
 * port of pine-shadow's PGLite/TanStack-session-specific auth code would
 * not fit this stack even if ported. The auth DOCTRINE that pine-shadow
 * encodes -- E5 "non-personalized mode is the default, auth is off for
 * visitors" and E6 "human command before any consequential write" -- is
 * faithfully ported already, in backend/src/lib/os/constitution.js
 * (evaluateConstitution, CONSTITUTION array). That is the real, verified
 * pine-shadow auth-adjacent logic; the files below it are not. */
const { AuthProvider, EmailPasswordProvider } = require('./provider');
const { AuthServer } = require('./server');
const { createAuthMiddleware, createGateMiddleware } = require('./middleware');

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
  initializeAuthServer
};
