/**
 * AI Guardrails
 * Component ID: EBD-CMP-00000006
 * Purpose: AI input/output validation and policy enforcement
 * 
 * This module provides comprehensive guardrails for AI operations including
 * input validation, output validation, policy enforcement, and security checks.
 */

'use strict';

const { logger } = require('../../utils/logger');

/**
 * Input validation rules
 */
const INPUT_RULES = {
  MAX_TEXT_LENGTH: 10000,
  MAX_TOKENS: 4000,
  ALLOWED_MIME_TYPES: ['text/plain', 'application/json', 'image/jpeg', 'image/png'],
  BLOCKED_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
  ],
};

/**
 * Output validation rules
 */
const OUTPUT_RULES = {
  MAX_TEXT_LENGTH: 50000,
  REQUIRE_STRUCTURED_OUTPUT: true,
  BLOCKED_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
  ],
};

/**
 * Validate AI input
 */
function validateInput(input, context = {}) {
  const violations = [];
  
  // Check text length
  if (typeof input === 'string' && input.length > INPUT_RULES.MAX_TEXT_LENGTH) {
    violations.push({
      type: 'length',
      message: `Input exceeds maximum length of ${INPUT_RULES.MAX_TEXT_LENGTH}`,
      severity: 'error',
    });
  }
  
  // Check for blocked patterns
  if (typeof input === 'string') {
    for (const pattern of INPUT_RULES.BLOCKED_PATTERNS) {
      if (pattern.test(input)) {
        violations.push({
          type: 'security',
          message: 'Input contains blocked pattern',
          severity: 'critical',
        });
      }
    }
  }
  
  // Check MIME type for file inputs
  if (context.mimeType && !INPUT_RULES.ALLOWED_MIME_TYPES.includes(context.mimeType)) {
    violations.push({
      type: 'security',
      message: `MIME type ${context.mimeType} not allowed`,
      severity: 'error',
    });
  }
  
  return {
    valid: violations.length === 0,
    violations,
    sanitized: violations.length === 0 ? input : sanitizeInput(input, violations),
  };
}

/**
 * Validate AI output
 */
function validateOutput(output, context = {}) {
  const violations = [];
  
  // Check text length
  if (typeof output === 'string' && output.length > OUTPUT_RULES.MAX_TEXT_LENGTH) {
    violations.push({
      type: 'length',
      message: `Output exceeds maximum length of ${OUTPUT_RULES.MAX_TEXT_LENGTH}`,
      severity: 'warning',
    });
  }
  
  // Check for blocked patterns
  if (typeof output === 'string') {
    for (const pattern of OUTPUT_RULES.BLOCKED_PATTERNS) {
      if (pattern.test(output)) {
        violations.push({
          type: 'security',
          message: 'Output contains blocked pattern',
          severity: 'critical',
        });
      }
    }
  }
  
  // Check for structured output if required
  if (OUTPUT_RULES.REQUIRE_STRUCTURED_OUTPUT && context.requireStructured) {
    try {
      JSON.parse(output);
    } catch (e) {
      violations.push({
        type: 'structure',
        message: 'Output is not valid JSON when structured output required',
        severity: 'error',
      });
    }
  }
  
  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Sanitize input by removing violations
 */
function sanitizeInput(input, violations) {
  let sanitized = input;
  
  for (const violation of violations) {
    if (violation.type === 'length') {
      sanitized = sanitized.substring(0, INPUT_RULES.MAX_TEXT_LENGTH);
    } else if (violation.type === 'security') {
      // Remove blocked patterns
      for (const pattern of INPUT_RULES.BLOCKED_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
      }
    }
  }
  
  return sanitized;
}

/**
 * Check authorization for AI operation
 */
function checkAuthorization(user, operation, resource) {
  // This would typically integrate with the auth system
  // For now, we'll implement basic checks

  if (!user) {
    return { authorized: false, reason: 'No authenticated user on this request' };
  }

  const permissions = {
    'text_generation': ['user', 'admin', 'system'],
    'image_analysis': ['user', 'admin', 'system'],
    'classification': ['user', 'admin', 'system'],
    'admin_operations': ['admin', 'system'],
  };
  
  const allowedRoles = permissions[operation] || ['system'];
  
  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      reason: `User role ${user.role} not authorized for ${operation}`,
    };
  }
  
  return { authorized: true };
}

/**
 * Apply rate limiting for AI operations
 */
function checkRateLimit(userId, operation) {
  // This would typically integrate with the rate limiter
  // For now, we'll implement basic in-memory checks
  
  const limits = {
    'text_generation': { perMinute: 10, perHour: 100 },
    'image_analysis': { perMinute: 5, perHour: 50 },
    'classification': { perMinute: 20, perHour: 200 },
  };
  
  const limit = limits[operation] || { perMinute: 10, perHour: 100 };
  
  // In production, this would check against Redis or similar
  return {
    withinLimit: true,
    remaining: limit.perMinute,
    resetIn: 60,
  };
}

/**
 * Apply content policy filters
 */
function applyContentPolicy(content, policy) {
  const violations = [];
  
  if (policy.blockProfanity) {
    const profanityPattern = /\b(damn|hell|shit)\b/gi;
    if (profanityPattern.test(content)) {
      violations.push({
        type: 'content_policy',
        message: 'Content contains profanity',
        severity: 'warning',
      });
    }
  }
  
  if (policy.blockPII) {
    const piiPattern = /\b\d{3}-\d{2}-\d{4}\b/g; // SSN pattern
    if (piiPattern.test(content)) {
      violations.push({
        type: 'content_policy',
        message: 'Content contains potential PII',
        severity: 'warning',
      });
    }
  }
  
  return {
    violations,
    filtered: violations.length === 0 ? content : filterContent(content, violations),
  };
}

/**
 * Filter content based on violations
 */
function filterContent(content, violations) {
  let filtered = content;
  
  for (const violation of violations) {
    if (violation.type === 'content_policy') {
      // Apply content filtering
      filtered = filtered.replace(/\b(damn|hell|shit)\b/gi, '[REDACTED]');
      filtered = filtered.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED]');
    }
  }
  
  return filtered;
}

module.exports = {
  INPUT_RULES,
  OUTPUT_RULES,
  validateInput,
  validateOutput,
  sanitizeInput,
  checkAuthorization,
  checkRateLimit,
  applyContentPolicy,
};