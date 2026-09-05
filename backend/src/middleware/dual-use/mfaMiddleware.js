/**
 * MFA Middleware - Enforce MFA for protected routes
 */

const mfaService = require('../../services/dual-use/mfaService');

/**
 * MFA Required Middleware
 * Check if user has MFA enabled and verified
 */
const mfaRequired = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Check if MFA is enabled for user
    const isMFAEnabled = await mfaService.isMFAEnabled(userId);
    
    if (!isMFAEnabled) {
      // Allow users without MFA for now (gradual rollout)
      return next();
    }
    
    // Check if MFA has been verified in current session
    if (req.session?.mfaVerified) {
      return next();
    }
    
    // Return 403 requiring MFA verification
    return res.status(403).json({
      success: false,
      error: 'MFA verification required',
      code: 'MFA_REQUIRED'
    });
  } catch (error) {
    console.error('MFA middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'MFA check failed'
    });
  }
};

/**
 * MFA Enforced Middleware
 * Strictly require MFA for protected routes
 */
const mfaEnforced = async (req, res, next) => {
  try {
    let userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Check if MFA is enabled for user
    let isMFAEnabled = await mfaService.isMFAEnabled(userId);
    
    if (!isMFAEnabled) {
      return res.status(403).json({
        success: false,
        error: 'MFA must be enabled to access this resource',
        code: 'MFA_NOT_ENABLED'
      });
    }
    
    // Check if MFA has been verified in current session
    if (req.session?.mfaVerified) {
      return next();
    }
    
    // Return 403 requiring MFA verification
    return res.status(403).json({
      success: false,
      error: 'MFA verification required',
      code: 'MFA_REQUIRED'
    });
  } catch (error) {
    console.error('MFA enforced middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'MFA check failed'
    });
  }
};

/**
 * Verify MFA Token Middleware
 * Verify MFA token from request
 */
const verifyMFAToken = async (req, res, next) => {
  try {
    const { mfaToken } = req.body;
    let userId = req.user?.id;
    
    if (!mfaToken) {
      return res.status(400).json({
        success: false,
        error: 'MFA token required'
      });
    }
    
    // Get user's MFA secret
    const userSecret = await getUserMFASecret(userId);
    
    if (!userSecret) {
      return res.status(400).json({
        success: false,
        error: 'MFA not enabled for this user'
      });
    }
    
    // Verify token
    const verified = mfaService.verifyToken(userSecret, mfaToken);
    
    if (verified) {
      // Mark MFA as verified in session
      req.session.mfaVerified = true;
      return next();
    } else {
      return res.status(401).json({
        success: false,
        error: 'Invalid MFA token'
      });
    }
  } catch (error) {
    console.error('MFA token verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'MFA token verification failed'
    });
  }
};

// Helper function placeholder
async function getUserMFASecret(userId) {
  // Database call to get user's MFA secret
  return null;
}

module.exports = {
  mfaRequired,
  mfaEnforced,
  verifyMFAToken
};
