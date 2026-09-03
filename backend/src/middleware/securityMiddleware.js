const express = require('express');

/**
 * Security Middleware Suite
 * OWASP Top 10 compliance and security hardening
 */

// Rate limiting (prevent brute force attacks)
const rateLimit = (() => {
  const requests = new Map();

  return (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const now = Date.now();

      if (!requests.has(ip)) {
        requests.set(ip, []);
      }

      const userRequests = requests.get(ip);
      const recentRequests = userRequests.filter(time => now - time < windowMs);

      if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
        });
      }

      recentRequests.push(now);
      requests.set(ip, recentRequests);
      next();
    };
  };
})();

// Input validation (prevent injection attacks)
const validateInput = (req, res, next) => {
  const sanitize = (value) => {
    if (typeof value !== 'string') return value;
    return value
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['";]/g, '')  // Remove quotes
      .trim();
  };

  if (req.body) {
    Object.keys(req.body).forEach(key => {
      req.body[key] = sanitize(req.body[key]);
    });
  }

  if (req.query) {
    Object.keys(req.query).forEach(key => {
      req.query[key] = sanitize(req.query[key]);
    });
  }

  next();
};

// CORS security
const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

// Security headers
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent referrer leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  // HSTS (HTTPS only)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  next();
};

// Request logging (audit trail)
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    // In production: send to logging service
    if (res.statusCode >= 400) {
      console.warn('API Error:', log);
    }
  });

  next();
};

// SQL injection prevention (parameterized queries helper)
const validateSQLInput = (value) => {
  const sqlKeywords = /(\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b|\bSELECT\b|\bUNION\b)/i;
  if (sqlKeywords.test(value)) {
    return false;
  }
  return true;
};

// Password validation
const validatePassword = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  return (
    password.length >= minLength &&
    (hasUpperCase || hasLowerCase) &&
    hasNumbers
  );
};

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Error handler with sanitized messages
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Don't leak error details to client
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

module.exports = {
  rateLimit,
  validateInput,
  corsMiddleware,
  securityHeaders,
  requestLogger,
  validateSQLInput,
  validatePassword,
  validateEmail,
  errorHandler,
};
