/**
 * COMPLETE LIBRARY SETUP - All Missing Libs Created & Integrated
 * ============================================================
 */

'use strict';

// ============================================================================
// 1. CACHE LIBRARY - Redis wrapper
// ============================================================================

const redis = require('redis');
const { logger } = require('../utils/logger');

class CacheService {
  static instance = null;
  static client = null;

  static async initialize() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null,
        db: process.env.REDIS_DB || 0,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis error:', err);
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
      });

      await this.client.connect();
      logger.info('Cache service initialized');
      return this;
    } catch (err) {
      logger.error('Failed to initialize cache:', err);
      throw err;
    }
  }

  static async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error(`Cache get error for key ${key}:`, err);
      return null;
    }
  }

  static async set(key, value, ttl = 3600) {
    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      return true;
    } catch (err) {
      logger.error(`Cache set error for key ${key}:`, err);
      return false;
    }
  }

  static async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (err) {
      logger.error(`Cache delete error for key ${key}:`, err);
      return false;
    }
  }

  static async invalidatePattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (err) {
      logger.error(`Cache invalidate error for pattern ${pattern}:`, err);
      return false;
    }
  }
}

// ============================================================================
// 2. VALIDATORS LIBRARY
// ============================================================================

class ValidatorService {
  static validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static validatePhone(phone) {
    // Indian phone number
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone.replace(/\D/g, ''));
  }

  static validatePassword(password) {
    return {
      valid: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*]/.test(password),
    };
  }

  static validateInput(data, rules) {
    const errors = {};

    Object.entries(rules).forEach(([field, rule]) => {
      const value = data[field];

      if (rule.required && !value) {
        errors[field] = `${field} is required`;
      } else if (value) {
        if (rule.type === 'email' && !this.validateEmail(value)) {
          errors[field] = 'Invalid email';
        } else if (rule.type === 'phone' && !this.validatePhone(value)) {
          errors[field] = 'Invalid phone number';
        } else if (rule.minLength && value.length < rule.minLength) {
          errors[field] = `Minimum length is ${rule.minLength}`;
        } else if (rule.maxLength && value.length > rule.maxLength) {
          errors[field] = `Maximum length is ${rule.maxLength}`;
        } else if (rule.pattern && !rule.pattern.test(value)) {
          errors[field] = rule.message || 'Invalid format';
        }
      }
    });

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

// ============================================================================
// 3. STORAGE LIBRARY - File management
// ============================================================================

const AWS = require('aws-sdk');
const multer = require('multer');

class StorageService {
  static s3 = null;
  static localStorage = null;

  static initialize() {
    // Initialize S3 if credentials provided
    if (process.env.AWS_ACCESS_KEY_ID) {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
      });
      logger.info('S3 storage initialized');
    }

    // Initialize local storage
    this.localStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
      },
    });

    return this;
  }

  static async uploadFile(file, bucket = 'ebdesign-uploads') {
    try {
      if (this.s3) {
        const params = {
          Bucket: bucket,
          Key: `${Date.now()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const result = await this.s3.upload(params).promise();
        return { url: result.Location, key: result.Key };
      }
      return { file: file.path };
    } catch (err) {
      logger.error('File upload error:', err);
      throw err;
    }
  }

  static async deleteFile(key, bucket = 'ebdesign-uploads') {
    try {
      if (this.s3) {
        await this.s3.deleteObject({ Bucket: bucket, Key: key }).promise();
        return true;
      }
      return true;
    } catch (err) {
      logger.error('File delete error:', err);
      throw err;
    }
  }

  static getUploadMiddleware() {
    return multer({ storage: this.localStorage, limits: { fileSize: 50 * 1024 * 1024 } });
  }
}

// ============================================================================
// 4. EMAIL LIBRARY
// ============================================================================

const nodemailer = require('nodemailer');

class EmailService {
  static transporter = null;

  static initialize() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    logger.info('Email service initialized');
    return this;
  }

  static async send(to, subject, html, text) {
    try {
      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ebdesign.com',
        to,
        subject,
        html,
        text,
      });
      logger.info(`Email sent to ${to}`);
      return result;
    } catch (err) {
      logger.error(`Email send error to ${to}:`, err);
      throw err;
    }
  }

  static async sendBulk(recipients, subject, html, text) {
    try {
      const promises = recipients.map(to => this.send(to, subject, html, text));
      return await Promise.all(promises);
    } catch (err) {
      logger.error('Bulk email error:', err);
      throw err;
    }
  }

  static async sendTemplate(to, templateName, data) {
    const templates = {
      welcome: (data) => ({
        subject: `Welcome to EBDESIGN, ${data.name}!`,
        html: `<h1>Welcome!</h1><p>Your account has been created.</p>`,
      }),
      resetPassword: (data) => ({
        subject: 'Reset your password',
        html: `<h1>Reset Password</h1><p><a href="${data.link}">Click here to reset</a></p>`,
      }),
      orderConfirmation: (data) => ({
        subject: `Order #${data.orderId} Confirmed`,
        html: `<h1>Order Confirmed</h1><p>Your order has been placed.</p>`,
      }),
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const { subject, html } = template(data);
    return this.send(to, subject, html);
  }
}

// ============================================================================
// 5. ERRORS LIBRARY - Enhanced
// ============================================================================

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

// ============================================================================
// 6. LIBS INDEX - Central export
// ============================================================================

module.exports = {
  CacheService,
  ValidatorService,
  StorageService,
  EmailService,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
};
