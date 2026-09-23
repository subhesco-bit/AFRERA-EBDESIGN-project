'use strict';
/** Fetch-Metadata same-site request validation. Faithfully ported (logic
 * only, re-platformed from TanStack's getRequest()/Headers to a plain
 * Express req) from pine-shadow's src/lib/auth/isolation.server.ts.
 *
 * Pine-shadow's own framing is specific to the `*.grok.me` multi-tenant
 * sandbox (mutually-untrusted sibling apps sharing a parent domain) --
 * that specific threat model doesn't apply to this deployment. But the
 * underlying technique -- using the browser-sent `Sec-Fetch-Site` /
 * `Sec-Fetch-Mode` / `Sec-Fetch-Dest` headers to reject scripted
 * cross-site requests (CSRF-style attacks) while still allowing
 * same-origin calls, non-browser/server-to-server calls, and top-level
 * GET navigations (e.g. an OAuth callback redirect) -- is standard,
 * framework-agnostic web security practice, and is real, working logic
 * independent of any Grok-specific infrastructure. Provided here as an
 * available Express middleware; not wired into any live route, per
 * CLAUDE.md's "Authentication/authorization logic: DO NOT CHANGE". */

class CrossSiteRequestError extends Error {
  constructor() {
    super('Forbidden: cross-site request blocked');
    this.name = 'CrossSiteRequestError';
    this.status = 403;
  }
}

/**
 * True if this request should be rejected as a scripted cross-site call.
 * @param {import('http').IncomingHttpHeaders} headers
 * @param {string} method
 */
function isCrossSiteScriptedRequest(headers, method) {
  const site = headers['sec-fetch-site'];
  // No header (non-browser / server-to-server), same-origin, or a direct
  // address-bar/bookmark load ("none") are all fine.
  if (!site || site === 'same-origin' || site === 'none') return false;
  // A top-level GET navigation (e.g. an OAuth callback redirect) is fine
  // even when cross-site; scripted requests never set navigate mode.
  const dest = headers['sec-fetch-dest'];
  const isTopLevelGet = headers['sec-fetch-mode'] === 'navigate' && method === 'GET' && dest !== 'object' && dest !== 'embed';
  if (isTopLevelGet) return false;
  return true;
}

/** Throws CrossSiteRequestError for a scripted cross-site request. */
function assertSameSiteRequest(headers, method) {
  if (isCrossSiteScriptedRequest(headers, method)) throw new CrossSiteRequestError();
}

/** Express middleware wrapping assertSameSiteRequest(). Not auto-mounted. */
function sameSiteGuard() {
  return (req, res, next) => {
    try {
      assertSameSiteRequest(req.headers, req.method);
      next();
    } catch (err) {
      if (err instanceof CrossSiteRequestError) {
        res.status(403).json({ error: err.message });
        return;
      }
      next(err);
    }
  };
}

module.exports = { CrossSiteRequestError, isCrossSiteScriptedRequest, assertSameSiteRequest, sameSiteGuard };
