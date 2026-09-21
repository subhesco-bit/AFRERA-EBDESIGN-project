// CRITICAL FIXES FOR authService.js
// Apply these changes to backend/src/services/authService.js

// FIX 1: Add validation import at top (after other requires)
// Add after line 16 (after const { getPostgreSQL } = require('../database/connection');):
const { validateEmail, validatePassword, validateTOTPCode } = require('../utils/validation');

// ============================================================================
// FIX 2: Add email validation to loginUser() function
// Replace line ~500: const userQuery = `...` 
// OLD CODE:
//    const userResult = await pg.query(userQuery, [email.toLowerCase()]);
//
// NEW CODE (with validation):
async function loginUser(email, password, deviceInfo = {}) {
  try {
    // *** ADD THIS: Email validation prevents injection ***
    const normalizedEmail = validateEmail(email);
    
    const pg = getPostgreSQL();
    if (!pg) {
      // Fallback mode
      const user = getFallbackUserByEmail(normalizedEmail);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const passwordValid = passwordHash ? await comparePassword(password, passwordHash) : false;
      if (!passwordValid) {
        throw new Error('Invalid credentials');
      }
      // ... rest of function
    }
    
    // Database mode - use validated email
    const userQuery = `
      SELECT u.*, up.first_name, up.last_name, up.profile_image_url
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.email = $1
    `;
    
    const userResult = await pg.query(userQuery, [normalizedEmail]); // Use validated email
    // ... rest of function
  } catch (error) {
    // ...
  }
}

// ============================================================================
// FIX 3: Add TTL verification to refreshAccessToken()
// Replace the token query around line ~750
// OLD CODE:
//    const tokenQuery = `
//      SELECT * FROM refresh_tokens
//      WHERE user_id = $1 AND token = $2 AND revoked = FALSE
//      ORDER BY created_at DESC
//      LIMIT 1
//    `;

// NEW CODE (with TTL check):
async function refreshAccessToken(refreshToken) {
  try {
    const payload = verifyToken(refreshToken);
    
    if (payload.tokenType !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    const pg = getPostgreSQL();
    // ... fallback mode code ...
    
    // *** CRITICAL FIX: Add expires_at > NOW() to the query ***
    const tokenQuery = `
      SELECT * FROM refresh_tokens
      WHERE user_id = $1 AND token = $2 AND revoked = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const tokenResult = await pg.query(tokenQuery, [payload.userId, refreshToken]);
    
    // *** NEW: Add safety check even if DB query returned a row ***
    if (tokenResult.rows.length === 0) {
      throw new Error('Invalid or expired refresh token');
    }
    
    const tokenRow = tokenResult.rows[0];
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      await pg.query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1', [tokenRow.id]);
      throw new Error('Refresh token expired');
    }
    
    // ... rest of function
  } catch (error) {
    // ...
  }
}

// ============================================================================
// FIX 4: Add TOTP code validation
// In verifyTwoFactor() around line ~810, add validation:
async function verifyTwoFactor(userId, code) {
  try {
    // *** ADD THIS: Validate TOTP code format ***
    validateTOTPCode(code);
    
    const pg = getPostgreSQL();
    
    const userResult = await pg.query(
      'SELECT two_factor_secret FROM users WHERE id = $1',
      [userId]
    );
    
    // ... rest of function
  } catch (error) {
    // ...
  }
}

// ============================================================================
// FIX 5: Add email validation to registerUser()
// Replace around line ~280:
// OLD CODE:
//    const normalizedEmail = (userData.email || '').toLowerCase();
//
// NEW CODE:
async function registerUser(userData) {
  try {
    // *** ADD THIS: Validate email and password early ***
    const normalizedEmail = validateEmail(userData.email);
    validatePassword(userData.password);
    
    const pg = getPostgreSQL();
    // ... rest of function
  } catch (error) {
    // ...
  }
}

// ============================================================================
// FIX 6: Add email validation to OAuth authenticate
// Around line ~950, add validation before checking user:
async function oauthAuthenticate(provider, code, redirectUri) {
  try {
    // ... existing code ...
    
    const userInfo = await getOAuthUserInfo(provider, tokens.access_token);
    
    // *** ADD THIS: Validate OAuth-provided email ***
    const normalizedEmail = validateEmail(userInfo.email);
    
    const pg = getPostgreSQL();
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pg.query(userQuery, [normalizedEmail]); // Use validated email
    
    // ... rest of function
  } catch (error) {
    // ...
  }
}

// ============================================================================
// FINAL STEP: Export validation functions from authService
// At the bottom of the file, add to module.exports:
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
  generateRefreshToken,
  lazyAuth  // *** ENSURE THIS IS EXPORTED ***
};
