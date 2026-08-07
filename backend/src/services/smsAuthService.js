/**
 * SMS Authentication Service
 * Advanced SMS-based authentication system for farmers and rural users
 * Supports multiple languages, voice calls, and accessibility features
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const crypto = require('crypto');

// Twilio Configuration
const TWILIO_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_PHONE_NUMBER,
  voiceEnabled: process.env.TWILIO_VOICE_ENABLED === 'true'
};

// Initialize Twilio client.
//
// The `require('twilio')` sits inside the credentials branch rather than at
// the top of the file. The SDK costs about two seconds to load, and this
// module already knows it will not use it when no credentials are present —
// it says so in the warning below and every send site guards on
// `twilioClient`. Loading the SDK anyway meant every test run, and every
// deployment without SMS configured, paid two seconds for a client that was
// then never constructed.
//
// Behaviour is unchanged where credentials exist: the SDK loads immediately
// before the client is built, and a genuinely missing package still throws
// into the same catch.
let twilioClient;
try {
  if (TWILIO_CONFIG.accountSid && TWILIO_CONFIG.authToken) {
    // eslint-disable-next-line global-require
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_CONFIG.accountSid, TWILIO_CONFIG.authToken);
  } else {
    logger.warn('Twilio credentials not configured, SMS service will run in mock mode');
  }
} catch (error) {
  logger.error('Failed to initialize Twilio client', { error: error.message, stack: error.stack });
}

// OTP Configuration
const OTP_CONFIG = {
  length: 6,
  expiryMinutes: 10,
  maxAttempts: 3,
  resendCooldownSeconds: 60,
  voiceLanguageMap: {
    'en': 'en-US',
    'hi': 'hi-IN',
    'as': 'as-IN',
    'bn': 'bn-IN',
    'mni': 'mni-IN',
    'or': 'or-IN'
  }
};

/**
 * Generate secure OTP
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash OTP for storage
 */
function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Send SMS OTP
 */
async function sendSMSOTP(phoneNumber, otp, language = 'en') {
  try {
    const messageTemplates = {
      'en': `Your AFRERA verification code is ${otp}. Valid for 10 minutes. Do not share this code.`,
      'hi': `आपका AFRERA सत्यापन कोड ${otp} है। यह 10 मिनट के लिए वैध है। इस कोड को साझा न करें।`,
      'as': `আপোনাৰ AFRERA সত্যাপন কোড ${otp}। ইয়াক ১০ মিনিটৰ বাবে বৈধ। এই কোডটো অন্যৰ সৈতে অংশীদাৰ কৰিব নাই।`,
      'bn': `আপনার AFRERA যাচাইকরণ কোড ${otp}। এটি ১০ মিনিটের জন্য বৈধ। এই কোডটি অন্যের সাথে শেয়ার করবেন না।`,
      'mni': `অতোয়ার আফ্ৰেৰা যাচাইকরণ কোড ${otp}। অদো ১০ মিনিটীগী কালত ওইবা। অসি কোড অদুগী অন্যতৈ শেয়ার করিবা ঙাইদোক।`,
      'or': `ଆପଣଙ୍କର AFRERA ଯାଞ୍ଚ କୋଡ୍ ${otp}। ଏହା ୧୦ ମିନିଟ୍ ପାଇଁ ବୈଧ। ଏହି କୋଡ୍ ଅନ୍ୟ ସହିତ ସେୟାର କରନ୍ତୁ ନାହିଁ।`
    };

    const message = messageTemplates[language] || messageTemplates['en'];

    if (twilioClient) {
      await twilioClient.messages.create({
        body: message,
        from: TWILIO_CONFIG.fromNumber,
        to: phoneNumber
      });
      logger.info(`SMS OTP sent to ${phoneNumber}`);
    } else {
      logger.info(`[MOCK MODE] SMS OTP sent to ${phoneNumber}: ${otp}`);
    }

    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    logger.error('Failed to send SMS OTP', { error: error.message, stack: error.stack });
    throw new Error('Failed to send OTP via SMS');
  }
}

/**
 * Send Voice OTP for accessibility
 */
async function sendVoiceOTP(phoneNumber, otp, language = 'en') {
  try {
    if (!TWILIO_CONFIG.voiceEnabled) {
      throw new Error('Voice OTP not enabled');
    }

    const voiceTemplate = {
      'en': `Your AFRERA verification code is ${otp}. Repeat. ${otp}. This code expires in 10 minutes.`,
      'hi': `आपका AFRERA सत्यापन कोड ${otp} है। दोहराना। ${otp}। यह कोड 10 मिनट में समाप्त हो जाएगा।`,
      'as': `আপোনাৰ AFRERA সত্যাপন কোড ${otp}। পুনৰাবৃত্তি। ${otp}। এই কোডটো ১০ মিনিটত সমাপ্ত হ'ব।`,
      'bn': `আপনার AFRERA যাচাইকরণ কোড ${otp}। পুনরাবৃত্তি। ${otp}। এই কোডটি ১০ মিনিটে মেয়াদ শেষ হবে।`,
      'mni': `অতোয়ার আফ্ৰেৰা যাচাইকরণ কোড ${otp}। পুনরাবৃত্তি। ${otp}। অদো ১০ মিনিটীগী কালত মেয়াদ ওইবা।`,
      'or': `ଆପଣଙ୍କର AFRERA ଯାଞ୍ଚ କୋଡ୍ ${otp}। ପୁନରାବୃତ୍ତି। ${otp}। ଏହି କୋଡ୍ ୧୦ ମିନିଟ୍ରେ ମିୟଦ ସରିବ।`
    };

    const message = voiceTemplate[language] || voiceTemplate['en'];
    const twimlLanguage = OTP_CONFIG.voiceLanguageMap[language] || 'en-US';

    if (twilioClient) {
      await twilioClient.calls.create({
        twiml: `<Response><Say language="${twimlLanguage}">${message}</Say></Response>`,
        from: TWILIO_CONFIG.fromNumber,
        to: phoneNumber
      });
      logger.info(`Voice OTP sent to ${phoneNumber}`);
    } else {
      logger.info(`[MOCK MODE] Voice OTP sent to ${phoneNumber}: ${otp}`);
    }

    return { success: true, message: 'Voice OTP sent successfully' };
  } catch (error) {
    logger.error('Failed to send Voice OTP', { error: error.message, stack: error.stack });
    throw new Error('Failed to send OTP via Voice');
  }
}

/**
 * Initiate SMS-based login
 */
async function initiateSMSLogin(phoneNumber, language = 'en', useVoice = false) {
  try {
    const pg = getPostgreSQL();

    // Check if phone number exists
    const userQuery = `
      SELECT u.*, up.first_name, up.last_name, up.preferred_language
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.phone = $1
    `;

    const userResult = await pg.query(userQuery, [phoneNumber]);

    if (userResult.rows.length === 0) {
      throw new Error('Phone number not registered');
    }

    const user = userResult.rows[0];

    // Check if user is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error('Account temporarily locked due to multiple failed attempts');
    }

    // Check cooldown period
    const lastOTPQuery = `
      SELECT created_at 
      FROM sms_otps 
      WHERE phone_number = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const lastOTPResult = await pg.query(lastOTPQuery, [phoneNumber]);

    if (lastOTPResult.rows.length > 0) {
      const lastOTPTimestamp = new Date(lastOTPResult.rows[0].created_at);
      const cooldownEnd = new Date(lastOTPTimestamp.getTime() + OTP_CONFIG.resendCooldownSeconds * 1000);

      if (new Date() < cooldownEnd) {
        const remainingSeconds = Math.ceil((cooldownEnd - new Date()) / 1000);
        throw new Error(`Please wait ${remainingSeconds} seconds before requesting another OTP`);
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60 * 1000);

    // Store OTP
    const otpQuery = `
      INSERT INTO sms_otps (phone_number, otp_hash, expires_at, language, attempt_count)
      VALUES ($1, $2, $3, $4, 0)
      RETURNING id
    `;

    await pg.query(otpQuery, [phoneNumber, otpHash, expiresAt, language]);

    // Send OTP via SMS or Voice
    if (useVoice && TWILIO_CONFIG.voiceEnabled) {
      await sendVoiceOTP(phoneNumber, otp, language);
    } else {
      await sendSMSOTP(phoneNumber, otp, language);
    }

    logger.info(`SMS login initiated for ${phoneNumber}`);

    return {
      success: true,
      message: useVoice ? 'Voice OTP sent' : 'SMS OTP sent',
      phone_number: phoneNumber,
      expires_in_minutes: OTP_CONFIG.expiryMinutes,
      user_exists: true,
      user_name: `${user.first_name} ${user.last_name}`.trim()
    };
  } catch (error) {
    logger.error('SMS login initiation failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Verify SMS OTP
 */
async function verifySMSOTP(phoneNumber, otp) {
  try {
    const pg = getPostgreSQL();

    // Get latest valid OTP
    const otpQuery = `
      SELECT * FROM sms_otps
      WHERE phone_number = $1
        AND expires_at > NOW()
        AND verified = false
        AND attempt_count < $2
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const otpResult = await pg.query(otpQuery, [phoneNumber, OTP_CONFIG.maxAttempts]);

    if (otpResult.rows.length === 0) {
      throw new Error('Invalid or expired OTP. Please request a new OTP.');
    }

    const otpRecord = otpResult.rows[0];

    // Verify OTP
    const otpHash = hashOTP(otp);
    if (otpRecord.otp_hash !== otpHash) {
      // Increment attempt count
      await pg.query(
        'UPDATE sms_otps SET attempt_count = attempt_count + 1 WHERE id = $1',
        [otpRecord.id]
      );

      if (otpRecord.attempt_count >= OTP_CONFIG.maxAttempts - 1) {
        throw new Error('Maximum OTP attempts exceeded. Please request a new OTP.');
      }

      throw new Error('Invalid OTP. Please try again.');
    }

    // Mark OTP as verified
    await pg.query(
      'UPDATE sms_otps SET verified = true, verified_at = NOW() WHERE id = $1',
      [otpRecord.id]
    );

    // Get user
    const userQuery = `
      SELECT u.*, up.first_name, up.last_name, up.preferred_language
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.phone = $1
    `;

    const userResult = await pg.query(userQuery, [phoneNumber]);
    const user = userResult.rows[0];

    // Reset failed login attempts
    await pg.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const authService = require('./authService');
    const accessToken = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    logger.info(`SMS login successful for ${phoneNumber}`);

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: {
          first_name: user.first_name,
          last_name: user.last_name,
          preferred_language: user.preferred_language
        }
      },
      accessToken,
      refreshToken,
      expiresIn: '15m'
    };
  } catch (error) {
    logger.error('SMS OTP verification failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Register user with phone number
 */
async function registerWithPhone(phoneNumber, userData, language = 'en') {
  try {
    const pg = getPostgreSQL();

    // Check if phone already exists
    const existingPhone = await pg.query(
      'SELECT id FROM users WHERE phone = $1',
      [phoneNumber]
    );

    if (existingPhone.rows.length > 0) {
      throw new Error('Phone number already registered');
    }

    // Generate OTP for verification
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60 * 1000);

    // Store pending registration
    const registrationQuery = `
      INSERT INTO pending_registrations (phone_number, user_data, otp_hash, expires_at, language)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    await pg.query(registrationQuery, [
      phoneNumber,
      JSON.stringify(userData),
      otpHash,
      expiresAt,
      language
    ]);

    // Send OTP
    await sendSMSOTP(phoneNumber, otp, language);

    logger.info(`Phone registration initiated for ${phoneNumber}`);

    return {
      success: true,
      message: 'OTP sent for verification',
      phone_number: phoneNumber,
      expires_in_minutes: OTP_CONFIG.expiryMinutes
    };
  } catch (error) {
    logger.error('Phone registration failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Complete phone registration
 */
async function completePhoneRegistration(phoneNumber, otp) {
  try {
    const pg = getPostgreSQL();

    // Get pending registration
    const registrationQuery = `
      SELECT * FROM pending_registrations
      WHERE phone_number = $1
        AND expires_at > NOW()
        AND verified = false
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const registrationResult = await pg.query(registrationQuery, [phoneNumber]);

    if (registrationResult.rows.length === 0) {
      throw new Error('Invalid or expired registration request');
    }

    const registration = registrationResult.rows[0];

    // Verify OTP
    const otpHash = hashOTP(otp);
    if (registration.otp_hash !== otpHash) {
      throw new Error('Invalid OTP');
    }

    // Mark registration as verified
    await pg.query(
      'UPDATE pending_registrations SET verified = true, verified_at = NOW() WHERE id = $1',
      [registration.id]
    );

    // Create user
    const userData = JSON.parse(registration.user_data);
    const authService = require('./authService');

    const user = await authService.registerUser({
      ...userData,
      phone: phoneNumber,
      status: 'active'
    });

    logger.info(`Phone registration completed for ${phoneNumber}`);

    return user;
  } catch (error) {
    logger.error('Phone registration completion failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get user preferred language
 */
async function getUserLanguage(phoneNumber) {
  try {
    const pg = getPostgreSQL();

    const query = `
      SELECT up.preferred_language
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.phone = $1
    `;

    const result = await pg.query(query, [phoneNumber]);

    if (result.rows.length > 0) {
      return result.rows[0].preferred_language || 'en';
    }

    return 'en';
  } catch (error) {
    logger.error('Failed to get user language', { error: error.message, stack: error.stack });
    return 'en';
  }
}

/**
 * Check service health
 */
function isHealthy() {
  return twilioClient !== undefined;
}

// Express router for API endpoints
const express = require('express');
// SECURITY 2026-08-04: these are AUTHENTICATION endpoints, so they cannot
// require authMiddleware — you cannot be logged in before you log in. The
// correct control is rate limiting: an unthrottled OTP /initiate is an SMS
// bombing vector against a citizen's phone AND a direct cost attack on the
// SMS gateway. authRateLimit is the strictest bucket available.
const { authRateLimit } = require('../middleware/rateLimiter');
const router = express.Router();

/**
 * POST /api/v1/sms-auth/initiate
 * Initiate SMS-based login
 */
router.post('/initiate', authRateLimit, async (req, res) => {
  try {
    const { phone_number, language, use_voice } = req.body;

    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Was referencing `phoneNumber` (never defined; the body field is
    // `phone_number`) -> ReferenceError, so SMS login always failed.
    const userLanguage = language || await getUserLanguage(phone_number);
    const result = await initiateSMSLogin(phone_number, userLanguage, use_voice);

    res.json(result);
  } catch (error) {
    logger.error('SMS login initiation API error', { error: error.message, stack: error.stack });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/sms-auth/verify
 * Verify SMS OTP
 */
router.post('/verify', authRateLimit, async (req, res) => {
  try {
    const { phone_number, otp } = req.body;

    if (!phone_number || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const result = await verifySMSOTP(phone_number, otp);
    res.json(result);
  } catch (error) {
    logger.error('SMS OTP verification API error', { error: error.message, stack: error.stack });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/sms-auth/register
 * Register user with phone number
 */
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { phone_number, user_data, language } = req.body;

    if (!phone_number || !user_data) {
      return res.status(400).json({ error: 'Phone number and user data are required' });
    }

    const result = await registerWithPhone(phone_number, user_data, language);
    res.json(result);
  } catch (error) {
    logger.error('Phone registration API error', { error: error.message, stack: error.stack });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/sms-auth/complete-registration
 * Complete phone registration
 */
router.post('/complete-registration', authRateLimit, async (req, res) => {
  try {
    const { phone_number, otp } = req.body;

    if (!phone_number || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const result = await completePhoneRegistration(phone_number, otp);
    res.json(result);
  } catch (error) {
    logger.error('Complete registration API error', { error: error.message, stack: error.stack });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/v1/sms-auth/languages
 * Get supported languages
 */
router.get('/languages', (req, res) => {
  res.json({
    languages: [
      { code: 'en', name: 'English', native_name: 'English' },
      { code: 'hi', name: 'Hindi', native_name: 'हिंदी' },
      { code: 'as', name: 'Assamese', native_name: 'অসমীয়া' },
      { code: 'bn', name: 'Bengali', native_name: 'বাংলা' },
      { code: 'mni', name: 'Manipuri', native_name: 'মৈতৈলোন্' },
      { code: 'or', name: 'Odia', native_name: 'ଓଡ଼ିଆ' }
    ],
    voice_enabled: TWILIO_CONFIG.voiceEnabled
  });
});

module.exports = {
  router,
  initiateSMSLogin,
  verifySMSOTP,
  registerWithPhone,
  completePhoneRegistration,
  sendSMSOTP,
  sendVoiceOTP,
  isHealthy
};