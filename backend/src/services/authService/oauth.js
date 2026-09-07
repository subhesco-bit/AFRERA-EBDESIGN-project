/**
 * OAuth2 (Google/Facebook) authentication flow. Split out of the former
 * monolithic services/authService.js (M11).
 */

const crypto = require('crypto');
const axios = require('axios');
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { JWT_CONFIG, OAUTH_PROVIDERS } = require('./config');
const { hashPassword } = require('./passwordUtils');
const { generateAccessToken, generateRefreshToken } = require('./tokens');

function generateRandomPassword() {
  return crypto.randomBytes(12).toString('base64url');
}

const OAUTH_TOKEN_ENDPOINTS = {
  google: 'https://oauth2.googleapis.com/token',
  facebook: 'https://graph.facebook.com/v18.0/oauth/access_token'
};

const OAUTH_USERINFO_ENDPOINTS = {
  google: 'https://www.googleapis.com/oauth2/v2/userinfo',
  facebook: 'https://graph.facebook.com/me?fields=id,email,first_name,last_name'
};

async function exchangeOAuthCode(provider, code, redirectUri) {
  const config = OAUTH_PROVIDERS[provider];
  const tokenUrl = OAUTH_TOKEN_ENDPOINTS[provider];

  if (!config || !tokenUrl) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const response = await axios.post(tokenUrl, {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  }, {
    headers: { 'Content-Type': 'application/json' }
  });

  return response.data;
}

async function getOAuthUserInfo(provider, accessToken) {
  const userInfoUrl = OAUTH_USERINFO_ENDPOINTS[provider];

  if (!userInfoUrl) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const response = await axios.get(userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const data = response.data;
  return {
    id: data.id,
    email: data.email,
    first_name: data.first_name || data.given_name || '',
    last_name: data.last_name || data.family_name || ''
  };
}

/**
 * OAuth2 authentication
 */
async function oauthAuthenticate(provider, code, redirectUri) {
  try {
    if (!OAUTH_PROVIDERS[provider] || !OAUTH_PROVIDERS[provider].enabled) {
      throw new Error(`${provider} OAuth not enabled`);
    }

    // Exchange code for access token
    const tokens = await exchangeOAuthCode(provider, code, redirectUri);

    // Get user info from OAuth provider
    const userInfo = await getOAuthUserInfo(provider, tokens.access_token);

    // Check if user exists
    const pg = getPostgreSQL();
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pg.query(userQuery, [userInfo.email]);

    let user;

    if (userResult.rows.length > 0) {
      // Existing user
      user = userResult.rows[0];

      // Update OAuth info
      await pg.query(
        `UPDATE user_profiles
         SET oauth_provider = $1, oauth_id = $2
         WHERE user_id = $3`,
        [provider, userInfo.id, user.id]
      );
    } else {
      // Create new user
      const passwordHash = await hashPassword(generateRandomPassword());

      const newUserQuery = `
        INSERT INTO users (email, password_hash, role, status, email_verified)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, role, status
      `;

      const newUserResult = await pg.query(newUserQuery, [
        userInfo.email.toLowerCase(),
        passwordHash,
        'consumer',
        'active',
        true
      ]);

      user = newUserResult.rows[0];

      // Create profile
      await pg.query(
        `INSERT INTO user_profiles (user_id, first_name, last_name, oauth_provider, oauth_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, userInfo.first_name || '', userInfo.last_name || '', provider, userInfo.id]
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`OAuth login: ${user.email} via ${provider}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      },
      accessToken,
      refreshToken,
      expiresIn: JWT_CONFIG.accessTokenExpiry
    };
  } catch (error) {
    logger.error('OAuth authentication failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get OAuth authorization URL
 */
function getOAuthAuthUrl(provider, state) {
  const config = OAUTH_PROVIDERS[provider];

  if (!config || !config.enabled) {
    throw new Error(`${provider} OAuth not enabled`);
  }

  const urls = {
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=openid email profile&state=${state}`,
    facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=email&state=${state}`
  };

  return urls[provider];
}

module.exports = {
  exchangeOAuthCode,
  getOAuthUserInfo,
  oauthAuthenticate,
  getOAuthAuthUrl
};
