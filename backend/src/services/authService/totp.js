/**
 * TOTP (RFC 6238) primitives used for two-factor authentication: base32
 * encode/decode, secret generation, QR code rendering, backup codes, and
 * code computation/verification. Split out of the former monolithic
 * services/authService.js (M11).
 */

const crypto = require('crypto');
const { logger } = require('../../utils/logger');
// Loaded on first QR generation, not at import. The encoder costs ~1.2s to
// load and is reached only by 2FA enrolment; every other route through this
// service paid for it. Call sites are unchanged.
const QRCode = { toDataURL: (...args) => require('qrcode').toDataURL(...args) };

// RFC 4648 base32 (no padding) - needed for TOTP secrets since Node has no
// built-in base32 support, and authenticator apps (Google Authenticator,
// Authy, etc.) require secrets in this format.
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input) {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateTOTPSecret() {
  // 160-bit (20 byte) random secret, unique per call - the RFC 4226/6238
  // recommended length for HMAC-SHA1 based TOTP.
  return base32Encode(crypto.randomBytes(20));
}

async function generateQRCode(secret, userId) {
  const otpauthUrl = `otpauth://totp/AFRERA:${userId}?secret=${secret}&issuer=AFRERA`;
  try {
    // Real scannable QR code (base64 PNG data URI) using the already-installed
    // `qrcode` dependency, so the frontend can render it directly in an <img> tag.
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    logger.error('QR code image generation failed, falling back to raw URI', { error: error.message, stack: error.stack });
    return otpauthUrl;
  }
}

function generateBackupCodes() {
  // Cryptographically random 10 backup codes (was Math.random(), which is not
  // safe for anything security-sensitive)
  return Array.from({ length: 10 }, () =>
    crypto.randomBytes(5).toString('hex').toUpperCase()
  );
}

/**
 * Compute the TOTP code for a given secret at the current time step
 * (RFC 6238 - HMAC-SHA1, 30s time step, 6 digits).
 */
function computeTOTP(secretBase32, counterOffset = 0, timeStep = 30, digits = 6) {
  const key = base32Decode(secretBase32);
  const counter = Math.floor(Date.now() / 1000 / timeStep) + counterOffset;

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter >>> 0, 4);

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binaryCode % 10 ** digits).toString().padStart(digits, '0');
}

function verifyTOTPCode(secret, code) {
  if (!secret || !code || !/^\d{6}$/.test(code)) {
    return false;
  }
  // Allow the previous/current/next 30s window to tolerate clock drift
  // between the server and the user's authenticator app.
  return [0, -1, 1].some((offset) => computeTOTP(secret, offset) === code);
}

module.exports = {
  base32Encode,
  base32Decode,
  generateTOTPSecret,
  generateQRCode,
  generateBackupCodes,
  computeTOTP,
  verifyTOTPCode
};
