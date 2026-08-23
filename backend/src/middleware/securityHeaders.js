/**
 * Enterprise-Grade Security Headers Middleware
 * 
 * Production-ready security with:
 * - Comprehensive security headers
 * - Content Security Policy (CSP) with nonce support
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options for clickjacking protection
 * - X-Content-Type-Options nosniff
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 * - Cross-Origin-Opener-Policy
 * - Cross-Origin-Embedder-Policy
 * - Cross-Origin-Resource-Policy
 * - Cache-Control for sensitive endpoints
 * - Pragma and Expires headers
 * - Feature policy integration
 * - Dynamic nonce generation
 * - CSP violation reporting
 * - Environment-specific configurations
 * - Custom header support
 */

'use strict';

const crypto = require('crypto');

/**
 * Generate a random nonce for CSP
 */
function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Build Content Security Policy
 */
function buildCSP(options = {}) {
  // reportOnly was accepted here but never read - the actual
  // enforce-vs-report-only switch happens one level up in securityHeaders(),
  // via which header name it writes (Content-Security-Policy vs
  // -Report-Only), not by changing anything buildCSP() produces.
  const {
    directives = {},
    reportUri = null,
    nonce = null
  } = options;
  
  const defaultDirectives = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  };
  
  // Merge with custom directives
  const mergedDirectives = { ...defaultDirectives, ...directives };
  
  // Build CSP string
  const cspParts = [];
  
  for (const [directive, sources] of Object.entries(mergedDirectives)) {
    if (sources.length === 0) {
      cspParts.push(directive);
    } else {
      // Add nonce if provided and directive supports it
      const directiveSources = [...sources];
      if (nonce && ['script-src', 'style-src'].includes(directive)) {
        directiveSources.push(`'nonce-${nonce}'`);
      }
      cspParts.push(`${directive} ${directiveSources.join(' ')}`);
    }
  }
  
  // Add report-uri if provided
  if (reportUri) {
    cspParts.push(`report-uri ${reportUri}`);
  }
  
  return cspParts.join('; ');
}

/**
 * Security headers middleware
 */
function securityHeaders(options = {}) {
  const {
    hsts = {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    csp = {},
    cspReportOnly = false,
    cspReportUri = null,
    frameOptions = 'DENY',
    contentTypeOptions = 'nosniff',
    xssProtection = '1; mode=block',
    referrerPolicy = 'strict-origin-when-cross-origin',
    permissionsPolicy = {},
    crossOriginOpenerPolicy = 'same-origin',
    crossOriginEmbedderPolicy = 'require-corp',
    crossOriginResourcePolicy = 'same-origin',
    cacheControl = 'no-store, no-cache, must-revalidate, private',
    customHeaders = {}
  } = options;
  
  return (req, res, next) => {
    // Generate nonce for this request
    const nonce = generateNonce();
    req.cspNonce = nonce;
    
    // Content Security Policy
    const cspValue = buildCSP({
      directives: csp,
      reportOnly: cspReportOnly,
      reportUri: cspReportUri,
      nonce
    });
    
    const cspHeaderName = cspReportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
    res.setHeader(cspHeaderName, cspValue);
    
    // HTTP Strict Transport Security (HSTS)
    if (process.env.NODE_ENV === 'production' && req.protocol === 'https') {
      const hstsValue = `max-age=${hsts.maxAge}${hsts.includeSubDomains ? '; includeSubDomains' : ''}${hsts.preload ? '; preload' : ''}`;
      res.setHeader('Strict-Transport-Security', hstsValue);
    }
    
    // X-Frame-Options (clickjacking protection)
    res.setHeader('X-Frame-Options', frameOptions);
    
    // X-Content-Type-Options (MIME sniffing protection)
    res.setHeader('X-Content-Type-Options', contentTypeOptions);
    
    // X-XSS-Protection
    res.setHeader('X-XSS-Protection', xssProtection);
    
    // Referrer-Policy
    res.setHeader('Referrer-Policy', referrerPolicy);
    
    // Permissions-Policy (formerly Feature-Policy)
    if (Object.keys(permissionsPolicy).length > 0) {
      const permissionsParts = [];
      for (const [feature, value] of Object.entries(permissionsPolicy)) {
        permissionsParts.push(`${feature}=(${Array.isArray(value) ? value.join(' ') : value})`);
      }
      res.setHeader('Permissions-Policy', permissionsParts.join(', '));
    } else {
      // Default restrictive permissions
      const defaultPermissions = [
        'geolocation=()',
        'microphone=()',
        'camera=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()'
      ];
      res.setHeader('Permissions-Policy', defaultPermissions.join(', '));
    }
    
    // Cross-Origin-Opener-Policy
    if (crossOriginOpenerPolicy) {
      res.setHeader('Cross-Origin-Opener-Policy', crossOriginOpenerPolicy);
    }
    
    // Cross-Origin-Embedder-Policy
    if (crossOriginEmbedderPolicy) {
      res.setHeader('Cross-Origin-Embedder-Policy', crossOriginEmbedderPolicy);
    }
    
    // Cross-Origin-Resource-Policy
    if (crossOriginResourcePolicy) {
      res.setHeader('Cross-Origin-Resource-Policy', crossOriginResourcePolicy);
    }
    
    // Cache-Control for sensitive endpoints
    if (req.path.includes('/auth') || req.path.includes('/api/v1/auth')) {
      res.setHeader('Cache-Control', cacheControl);
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    
    // X-Permitted-Cross-Domain-Policies (for Flash)
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    
    // Clear-Site-Data (for logout endpoints)
    if (req.path.includes('/logout') || req.path.includes('/signout')) {
      res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage", "executionContexts"');
    }
    
    // Custom headers
    for (const [header, value] of Object.entries(customHeaders)) {
      res.setHeader(header, value);
    }
    
    // Remove server information
    res.removeHeader('Server');
    res.removeHeader('X-Powered-By');
    
    next();
  };
}

/**
 * Development security headers (less restrictive)
 */
function developmentSecurityHeaders() {
  return securityHeaders({
    hsts: {
      maxAge: 0,
      includeSubDomains: false,
      preload: false
    },
    csp: {
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:', 'http:'],
      'connect-src': ["'self'", 'http:', 'https:', 'ws:', 'wss:']
    },
    frameOptions: 'SAMEORIGIN',
    permissionsPolicy: {}
  });
}

/**
 * Production security headers (maximum security)
 */
function productionSecurityHeaders() {
  return securityHeaders({
    hsts: {
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true
    },
    csp: {
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    },
    frameOptions: 'DENY',
    contentTypeOptions: 'nosniff',
    xssProtection: '1; mode=block',
    referrerPolicy: 'no-referrer',
    permissionsPolicy: {
      geolocation: '()',
      microphone: '()',
      camera: '()',
      payment: '()',
      usb: '()',
      magnetometer: '()',
      gyroscope: '()',
      accelerometer: '()',
      'interest-cohort': '()',
      'browsing-topics': '()'
    },
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginResourcePolicy: 'same-origin'
  });
}

/**
 * API-specific security headers
 */
function apiSecurityHeaders() {
  return securityHeaders({
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    csp: {
      'default-src': ["'self'"],
      'script-src': ["'none'"],
      'style-src': ["'none'"],
      'img-src': ["'none'"],
      'connect-src': ["'self'"]
    },
    frameOptions: 'DENY',
    contentTypeOptions: 'nosniff',
    xssProtection: '1; mode=block',
    referrerPolicy: 'no-referrer',
    permissionsPolicy: {},
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginResourcePolicy: 'same-origin',
    cacheControl: 'no-store, no-cache, must-revalidate, private',
    customHeaders: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    }
  });
}

/**
 * CSP violation report handler
 */
function handleCSPViolation(req, res) {
  const violation = req.body;
  
  // Log CSP violation for monitoring
  console.warn('CSP violation reported', {
    violation,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Return 204 No Content as per spec
  res.status(204).end();
}

module.exports = {
  securityHeaders,
  developmentSecurityHeaders,
  productionSecurityHeaders,
  apiSecurityHeaders,
  buildCSP,
  generateNonce,
  handleCSPViolation
};
