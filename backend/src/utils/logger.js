/**
 * Logger Utility
 * Provides structured logging with Winston for production-grade logging
 * Includes automatic redaction of sensitive data
 */

const winston = require('winston');
const path = require('path');

// Sensitive patterns to redact (security: prevent credential leaks)
const REDACT_PATTERNS = [
  { regex: /ANTHROPIC_API_KEY\s*[=:]\s*['"]?[^\s'"]+/gi, replacement: 'ANTHROPIC_API_KEY=***REDACTED***' },
  { regex: /(?:OPENAI_API_KEY|GOOGLE_API_KEY|GEMINI_API_KEY|AWS_SECRET_ACCESS_KEY|STRIPE_SECRET_KEY|TWILIO_AUTH_TOKEN)\s*[=:]\s*['"]?[^\s'"]+/gi, replacement: 'PROVIDER_SECRET=***REDACTED***' },
  { regex: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, replacement: 'Bearer ***REDACTED***' },
  { regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, replacement: '****-****-****-****' }, // Credit card
  { regex: /\b\d{6}\b/g, replacement: '***OTP***' }, // 6-digit OTP
  { regex: /"password"\s*:\s*"[^"]*"/gi, replacement: '"password":"***REDACTED***' },
  { regex: /"token"\s*:\s*"[^"]*"/gi, replacement: '"token":"***REDACTED***' },
  { regex: /"secret"\s*:\s*"[^"]*"/gi, replacement: '"secret":"***REDACTED***' },
  { regex: /"api_key"\s*:\s*"[^"]*"/gi, replacement: '"api_key":"***REDACTED***' },
  { regex: /api[_-]?key[=:\s]+[^\s,}]*/gi, replacement: 'api_key=***REDACTED***' },
  { regex: /password[=:\s]+[^\s,}]*/gi, replacement: 'password=***REDACTED***' },
  { regex: /Authorization:\s*Bearer\s+[^\s]*/gi, replacement: 'Authorization: Bearer ***REDACTED***' },
];

// Function to redact sensitive data
function redactSensitiveData(message) {
  let redacted = String(message);
  REDACT_PATTERNS.forEach(({ regex, replacement }) => {
    redacted = redacted.replace(regex, replacement);
  });
  return redacted;
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  verbose: 5,
};

// Define colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  verbose: 'cyan',
};

winston.addColors(colors);

// Define log format with redaction
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    const redactedMessage = redactSensitiveData(message);
    const redactedMeta = redactSensitiveData(JSON.stringify(metadata));
    return JSON.stringify({ timestamp, level, message: redactedMessage, ...JSON.parse(redactedMeta || '{}') });
  }),
);

// Console format for development (with redaction)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    const redactedMessage = redactSensitiveData(message);
    let msg = `${timestamp} [${level}]: ${redactedMessage}`;
    if (Object.keys(metadata).length > 0) {
      const redactedMeta = redactSensitiveData(JSON.stringify(metadata));
      msg += ` ${redactedMeta}`;
    }
    return msg;
  }),
);

// Create transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    level: process.env.LOG_LEVEL || 'info',
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || 'logs';

  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // HTTP request log
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
  );
}

// Create logger instance
const logger = winston.createLogger({
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Create child logger with context
function childLogger(context) {
  return logger.child({ context });
}

// HTTP request logger middleware
function httpLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
  });

  next();
}

// Error logger
function logError(error, context = {}) {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

module.exports = {
  logger,
  childLogger,
  httpLogger,
  logError,
  redactSensitiveData,
};
