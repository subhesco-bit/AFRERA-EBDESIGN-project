const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Encryption utilities
class SecurityUtils {
  // AES-256 encryption
  static encrypt(text, key = process.env.ENCRYPTION_KEY) {
    if (!key) throw new Error('Encryption key not configured');
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  // AES-256 decryption
  static decrypt(encryptedText, key = process.env.ENCRYPTION_KEY) {
    if (!key) throw new Error('Encryption key not configured');
    
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = parts.join(':');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Hash sensitive data
  static hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  // Generate secure token
  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Verify integrity
  static verifyIntegrity(data, signature, secret = process.env.JWT_SECRET) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    const computedSignature = hmac.digest('hex');
    return computedSignature === signature;
  }

  // Sign data
  static signData(data, secret = process.env.JWT_SECRET) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(data));
    return hmac.digest('hex');
  }
}

// Audit logging middleware
const auditLogger = (logger) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Log request
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      logger.info('API Response', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      originalSend.call(this, data);
    };

    next();
  };
};

// Rate limiting configuration
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for trusted IPs
    const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
    return trustedIPs.includes(req.ip);
  }
});

// Stricter rate limiting for sensitive endpoints
const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Slow down rate limiter
const slowDownLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: 500,
  maxDelayMs: 20000
});

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Data sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Remove potentially dangerous keys
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        
        sanitized[key] = sanitize(obj[key]);
      }
    }
    
    return sanitized;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// SQL injection prevention middleware
const preventSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION|SCRIPT)\b)/i,
    /(;|\-\-|\/\*|\*\/)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i
  ];

  const checkString = (str) => {
    if (typeof str !== 'string') return false;
    return sqlPatterns.some(pattern => pattern.test(str));
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (checkString(obj[key])) {
          return true;
        }
        if (typeof obj[key] === 'object') {
          if (checkObject(obj[key])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    return res.status(400).json({
      error: 'Invalid input detected'
    });
  }

  next();
};

// XSS prevention middleware
const preventXSS = (req, res, next) => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<[^>]*on\w+\s*=[^>]*>/gi
  ];

  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    let sanitized = str;
    xssPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    return sanitized;
  };

  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);

  next();
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  const csrfToken = req.get('x-csrf-token');
  const sessionToken = req.session?.csrfToken;

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      return res.status(403).json({
        error: 'CSRF token validation failed'
      });
    }
  }

  next();
};

// Security middleware composition
const securityMiddleware = (logger) => [
  securityHeaders,
  rateLimiter,
  slowDownLimiter,
  sanitizeInput,
  preventSQLInjection,
  preventXSS,
  auditLogger(logger)
];

module.exports = {
  SecurityUtils,
  auditLogger,
  rateLimiter,
  strictRateLimiter,
  slowDownLimiter,
  securityHeaders,
  sanitizeInput,
  preventSQLInjection,
  preventXSS,
  csrfProtection,
  securityMiddleware
};
