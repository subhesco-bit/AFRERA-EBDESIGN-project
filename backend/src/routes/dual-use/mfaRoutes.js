/**
 * MFA Routes - Multi-Factor Authentication API Endpoints
 */

const express = require('express.js');
const router = express.Router();
const mfaService = require('../../services/dual-use/mfaService.js');
const { authMiddleware } = require('../../middleware/auth.js');
const { adminMiddleware } = require('../../middleware/admin.js');

/**
 * POST /api/v1/mfa/setup
 * Setup MFA for user, returns QR code
 */
router.post('/setup', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Generate TOTP secret
    const { secret, otpauth_url } = mfaService.generateSecret(userId);
    
    // Generate QR code
    const qrCode = await mfaService.generateQRCode(otpauth_url);
    
    // Generate backup codes
    const backupCodes = mfaService.generateBackupCodes(userId);
    
    // Get user phone number for SMS backup
    const phoneNumber = req.user.phoneNumber; // Would come from user record
    
    // Enable MFA
    await mfaService.enableMFA(userId, secret, phoneNumber, backupCodes);
    
    res.json({
      success: true,
      data: {
        qrCode,
        otpauth_url,
        backupCodes: backupCodes.slice(0, 3), // Show first 3 codes for emergency use
        message: 'MFA setup complete. Save your backup codes securely.'
      }
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup MFA'
    });
  }
});

/**
 * POST /api/v1/mfa/verify
 * Verify MFA code during login
 */
router.post('/verify', async (req, res) => {
  try {
    const { token, userId } = req.body;
    
    // Get user's MFA secret from database
    const userSecret = await getUserMFASecret(userId); // Placeholder - would be database call
    
    if (!userSecret) {
      return res.status(400).json({
        success: false,
        error: 'MFA not enabled for this user'
      });
    }
    
    // Verify TOTP token
    const verified = mfaService.verifyToken(userSecret, token);
    
    if (verified) {
      res.json({
        success: true,
        message: 'MFA verification successful'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid MFA code'
      });
    }
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify MFA'
    });
  }
});

/**
 * POST /api/v1/mfa/disable
 * Disable MFA for user
 */
router.post('/disable', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Disable MFA
    await mfaService.disableMFA(userId);
    
    res.json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable MFA'
    });
  }
});

/**
 * POST /api/v1/mfa/backup/sms
 * Send SMS backup code
 */
router.post('/backup/sms', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Get user phone number
    let phoneNumber = req.user.phoneNumber;
    
    // Generate new backup code
    const backupCode = mfaService.generateBackupCode();
    
    // Send SMS
    await mfaService.sendSMSBackupCode(phoneNumber, backupCode);
    
    // Update backup codes in database
    await updateBackupCodes(userId, backupCode); // Placeholder - would be database call
    
    res.json({
      success: true,
      message: 'Backup code sent via SMS'
    });
  } catch (error) {
    console.error('SMS backup code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send SMS backup code'
    });
  }
});

/**
 * GET /api/v1/mfa/status
 * Check MFA status for user
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const isEnabled = await mfaService.isMFAEnabled(userId);
    
    res.json({
      success: true,
      data: {
        enabled: isEnabled,
        userId
      }
    });
  } catch (error) {
    console.error('MFA status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check MFA status'
    });
  }
});

// Helper function placeholders (would be replaced with actual database calls)
async function getUserMFASecret(userId) {
  // Database call to get user's MFA secret
  return null;
}

async function updateBackupCodes(userId, newCode) {
  // Database call to update backup codes
  return true;
}

module.exports = router;
