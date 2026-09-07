/**
 * MFA Service - Multi-Factor Authentication Implementation
 * Supports TOTP (Time-based One-Time Password) and SMS backup
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const twilio = require('twilio');

class MFAService {
  constructor() {
    this.secretLength = 32;
    this.backupCodeLength = 6;
  }

  /**
   * Generate TOTP secret for user
   */
  generateSecret(userId) {
    const secret = speakeasy.generateSecret({
      length: this.secretLength,
      name: `AFRERA-${userId}`,
      issuer: 'AFRERA Platform'
    });
    
    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url
    };
  }

  /**
   * Generate QR code for TOTP setup
   */
  async generateQRCode(otpauthUrl) {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify TOTP code
   */
  verifyToken(secret, token) {
    try {
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token
      });
      
      return verified;
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      return false;
    }
  }

  /**
   * Generate backup SMS codes
   */
  generateBackupCodes(userId) {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(this.generateBackupCode());
    }
    
    return codes;
  }

  /**
   * Generate single backup code
   */
  generateBackupCode() {
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < this.backupCodeLength; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Send SMS backup code via Twilio
   */
  async sendSMSBackupCode(phoneNumber, code) {
    try {
      const client = new twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      const message = `Your AFRERA backup code is: ${code}. Do not share this code with anyone.`;
      
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new Error('Failed to send SMS backup code');
    }
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId, secret, phoneNumber, backupCodes) {
    // Store MFA details in database
    // This would be implemented with actual database calls
    return {
      userId,
      secret,
      phoneNumber,
      backupCodes,
      enabled: true,
      enabledAt: new Date()
    };
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId) {
    // Remove MFA details from database
    return {
      userId,
      enabled: false,
      disabledAt: new Date()
    };
  }

  /**
   * Check if MFA is enabled for user
   */
  async isMFAEnabled(userId) {
    // Check database for MFA status
    return false; // Placeholder
  }
}

module.exports = new MFAService();
