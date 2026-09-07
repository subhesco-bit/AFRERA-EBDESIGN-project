/**
 * Auth service configuration: JWT settings and OAuth provider config.
 *
 * Split out of the former monolithic services/authService.js (M11 - god
 * service split). The JWT_SECRET boot-time guard below must still run
 * exactly once, the first time the authService directory is required
 * (same as when this was inline in the single file) - it is unconditional
 * module-load code, so requiring this module has the same effect as before.
 */

// SECURITY (H3, fixed 2026-08-16): JWT_SECRET used to silently fall back to a
// hardcoded literal visible in source when unset, letting anyone who reads the
// repo forge valid tokens. Fail closed at module load (boot time) in
// production; keep the dev-only fallback (with a loud warning) so local dev
// isn't forced to configure a secret just to run the server.
const INSECURE_DEV_JWT_SECRET = 'your-super-secret-key-change-in-production';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: JWT_SECRET is not set and NODE_ENV=production. Refusing to start ' +
      'with an insecure, hardcoded fallback JWT secret in production.'
    );
  }
  // eslint-disable-next-line no-console
  console.warn(
    'WARNING: JWT_SECRET is not set. Falling back to an insecure, hardcoded ' +
    'development-only secret. This is NEVER safe outside local dev/test - set ' +
    'JWT_SECRET before deploying anywhere else.'
  );
}

// JWT Configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || INSECURE_DEV_JWT_SECRET,
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  issuer: process.env.JWT_ISSUER || 'afrera-platform',
  audience: process.env.JWT_AUDIENCE || 'afrera-users'
};

// OAuth2 Configuration
const OAUTH_PROVIDERS = {
  google: {
    enabled: process.env.GOOGLE_OAUTH_ENABLED === 'true',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
  },
  facebook: {
    enabled: process.env.FACEBOOK_OAUTH_ENABLED === 'true',
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    redirectUri: process.env.FACEBOOK_REDIRECT_URI
  }
};

module.exports = { JWT_CONFIG, OAUTH_PROVIDERS };
