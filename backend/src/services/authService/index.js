/**
 * Authentication Service
 * Provides comprehensive authentication and authorization with JWT, OAuth2, and MFA
 *
 * (M11) Split from the former single-file services/authService.js into this
 * directory, purely for code organization - behavior is unchanged. Node
 * module resolution treats `require('./services/authService')` as
 * `./services/authService.js` OR `./services/authService/index.js`,
 * whichever exists, so every existing caller anywhere in the codebase
 * (`require('../services/authService')`, `require('../../services/authService')`,
 * etc.) continues to resolve here identically, unchanged.
 *
 * Sub-modules:
 *  - config.js       JWT/OAuth configuration + the JWT_SECRET boot guard (H3)
 *  - store.js         fallback (no-Postgres) JSON auth store
 *  - permissions.js   role -> permission mapping
 *  - passwordUtils.js bcrypt hash/compare
 *  - tokens.js         JWT sign/verify + refresh token persistence
 *  - totp.js           RFC 6238 TOTP primitives for 2FA
 *  - twoFactor.js       2FA setup/verify/disable
 *  - oauth.js           Google/Facebook OAuth2 flow
 *  - userAuth.js        register/login/refresh/logout
 *  - router.js          Express router wiring the above into HTTP routes
 */

const router = require('./router');
const { registerUser, loginUser, refreshAccessToken, logoutUser } = require('./userAuth');
const { setupTwoFactor, verifyTwoFactor, disableTwoFactor } = require('./twoFactor');
const { oauthAuthenticate, getOAuthAuthUrl } = require('./oauth');
const { verifyToken, generateAccessToken, generateRefreshToken } = require('./tokens');
const { hasPermission } = require('./permissions');

// Same exported shape as the original single-file authService.js -
// every export name and function signature preserved.
module.exports = {
  router,
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  setupTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  oauthAuthenticate,
  getOAuthAuthUrl,
  verifyToken,
  hasPermission,
  generateAccessToken,
  generateRefreshToken
};
