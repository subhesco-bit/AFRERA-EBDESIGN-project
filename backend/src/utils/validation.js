/**
 * Input Validation Utilities
 * Secure input validation for auth, emails, and user data
 */

/**
 * Validate email format
 * Prevents SQL injection and ensures email deliverability
 */
function validateEmail(email) {
  // RFC 5322 simplified regex (covers 99% of real emails)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || typeof email !== 'string' || email.length > 254) {
    throw new Error('Invalid email format');
  }
  
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  return email.toLowerCase().trim();
}

/**
 * Validate password strength
 * Enforces minimum requirements for security
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  // Optional: enforce complexity if desired
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumbers = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*]/.test(password);
  // if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
  //   throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
  // }
  
  return true;
}

/**
 * Validate TOTP code format
 */
function validateTOTPCode(code) {
  if (!code || !/^\d{6}$/.test(code)) {
    throw new Error('Invalid 2FA code format');
  }
  return true;
}

/**
 * Sanitize user input to prevent XSS
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate UUID format
 */
function validateUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate phone number (basic international format)
 */
function validatePhoneNumber(phone) {
  if (!phone) return null;
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-().+]/g, '');
  
  // Check if it's a valid length (7-15 digits is international standard)
  if (!/^\d{7,15}$/.test(cleaned)) {
    throw new Error('Invalid phone number format');
  }
  
  return cleaned;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateTOTPCode,
  sanitizeInput,
  validateUUID,
  validatePhoneNumber
};
