/**
 * COMPLETE REFACTORING GUIDE WITH CODE EXAMPLES
 * ==============================================
 * Ready-to-use refactored code for EBDESIGN Platform
 */

'use strict';

// ============================================================================
// 1. NEW ROUTE STRUCTURE WITH LAYERS
// ============================================================================

// api/v1/users/users.routes.js
const express = require('express');
const { UserController } = require('./users.controller');
const { authMiddleware } = require('../middleware/auth');
const { validateInput } = require('../middleware/validation');
const { UserValidator } = require('./users.validation');

const router = express.Router();

// Routes
router.get('/', 
  authMiddleware,
  UserController.list
);

router.get('/:id',
  authMiddleware,
  validateInput(UserValidator.getById, 'params'),
  UserController.getById
);

router.post('/',
  authMiddleware,
  validateInput(UserValidator.create, 'body'),
  UserController.create
);

router.put('/:id',
  authMiddleware,
  validateInput(UserValidator.update, 'body'),
  UserController.update
);

router.delete('/:id',
  authMiddleware,
  validateInput(UserValidator.delete, 'params'),
  UserController.delete
);

module.exports = router;

// ============================================================================
// 2. CONTROLLER LAYER
// ============================================================================

// api/v1/users/users.controller.js
const { UserService } = require('@modules/users/services');
const { UserDTO } = require('./users.dto');
const { AppError } = require('@libs/errors');
const { logger } = require('@libs/logger');

class UserController {
  static async list(req, res, next) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      
      const result = await UserService.list({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        userId: req.user.id,
      });

      res.json({
        data: result.users.map(u => UserDTO.toResponse(u)),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await UserService.findById(id);
      
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      res.json(UserDTO.toResponse(user));
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const data = req.body;
      
      // Check if user exists
      const existing = await UserService.findByEmail(data.email);
      if (existing) {
        throw new AppError('Email already exists', 409, 'EMAIL_EXISTS');
      }

      const user = await UserService.create(data);
      
      logger.info('User created', { userId: user.id, email: user.email });
      
      res.status(201).json(UserDTO.toResponse(user));
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;

      const user = await UserService.update(id, data);
      
      res.json(UserDTO.toResponse(user));
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      await UserService.delete(id);
      
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { UserController };

// ============================================================================
// 3. DTO LAYER (Data Transfer Object)
// ============================================================================

// api/v1/users/users.dto.js
class UserDTO {
  static toResponse(user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  static toCreate(data) {
    return {
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role || 'user',
    };
  }

  static toUpdate(data) {
    const updates = {};
    if (data.name) updates.name = data.name;
    if (data.email) updates.email = data.email;
    if (data.role) updates.role = data.role;
    return updates;
  }
}

module.exports = { UserDTO };

// ============================================================================
// 4. VALIDATION LAYER
// ============================================================================

// api/v1/users/users.validation.js
const Joi = require('joi');

const UserValidator = {
  getById: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  create: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().required(),
    role: Joi.string().valid('user', 'admin', 'manager'),
  }),

  update: Joi.object({
    email: Joi.string().email(),
    name: Joi.string(),
    role: Joi.string().valid('user', 'admin', 'manager'),
  }),

  delete: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

module.exports = { UserValidator };

// ============================================================================
// 5. SERVICE LAYER (Business Logic)
// ============================================================================

// modules/users/services/userService.js
const { UserRepository } = require('../repositories/userRepository');
const { CacheService } = require('@libs/cache');
const { logger } = require('@libs/logger');
const bcrypt = require('bcrypt');

class UserService {
  static repository = new UserRepository();
  static cache = new CacheService();

  static async list({ page = 1, limit = 20, search, userId }) {
    const offset = (page - 1) * limit;

    const users = await this.repository.list({
      offset,
      limit,
      search,
    });

    const total = await this.repository.count({ search });

    return {
      users,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  static async findById(id) {
    // Check cache first
    const cached = await this.cache.get(`user:${id}`);
    if (cached) {
      logger.debug('User found in cache', { userId: id });
      return cached;
    }

    // Get from database
    const user = await this.repository.findById(id);

    if (user) {
      // Cache for 1 hour
      await this.cache.set(`user:${id}`, user, 3600);
    }

    return user;
  }

  static async findByEmail(email) {
    return await this.repository.findByEmail(email);
  }

  static async create(data) {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.repository.create({
      ...data,
      password: hashedPassword,
    });

    // Invalidate cache
    await this.cache.del('users:all');

    logger.info('User created', { userId: user.id });

    return user;
  }

  static async update(id, data) {
    const user = await this.repository.update(id, data);

    // Invalidate cache
    await this.cache.del(`user:${id}`);
    await this.cache.del('users:all');

    logger.info('User updated', { userId: id });

    return user;
  }

  static async delete(id) {
    await this.repository.delete(id);

    // Invalidate cache
    await this.cache.del(`user:${id}`);
    await this.cache.del('users:all');

    logger.info('User deleted', { userId: id });
  }
}

module.exports = { UserService };

// ============================================================================
// 6. REPOSITORY LAYER (Data Access)
// ============================================================================

// modules/users/repositories/userRepository.js
const { db } = require('@libs/database');

class UserRepository {
  async list({ offset = 0, limit = 20, search }) {
    let query = 'SELECT id, email, name, role, created_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name ILIKE $1 OR email ILIKE $1)';
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  async count({ search }) {
    let query = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name ILIKE $1 OR email ILIKE $1)';
      params.push(`%${search}%`);
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  async findById(id) {
    const result = await db.query(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async findByEmail(email) {
    const result = await db.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  async create(data) {
    const result = await db.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [data.email, data.password, data.name, data.role]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const updates = {};
    if (data.name) updates.name = data.name;
    if (data.email) updates.email = data.email;
    if (data.role) updates.role = data.role;

    const columns = Object.keys(updates);
    const values = Object.values(updates);
    values.push(id);

    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');

    const result = await db.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${columns.length + 1} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async delete(id) {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

module.exports = { UserRepository };

// ============================================================================
// 7. CONFIG STRUCTURE
// ============================================================================

// config/index.js
module.exports = {
  ...require('./constants'),
  ...require('./database'),
  ...require('./cache'),
  ...require('./security'),
  ...require('./environments')[process.env.NODE_ENV] || require('./environments').development,
};

// config/constants.js
module.exports = {
  APP_NAME: 'EBDESIGN Platform',
  API_VERSION: 'v1',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  REQUEST_TIMEOUT: 30000,
  JWT_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
};

// config/registries/index.js
module.exports = {
  modules: require('./modules.registry'),
  routes: require('./routes.registry'),
  services: require('./services.registry'),
};

// ============================================================================
// 8. NEW MIDDLEWARE STRUCTURE
// ============================================================================

// api/middleware/validation.js
const Joi = require('joi');
const { AppError } = require('@libs/errors');

const validateInput = (schema, source = 'body') => {
  return (req, res, next) => {
    const toValidate = req[source];

    const { error, value } = schema.validate(toValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
        type: d.type,
      }));

      throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
    }

    req[source] = value;
    next();
  };
};

module.exports = { validateInput };

// ============================================================================
// 9. UNIFIED API INDEX
// ============================================================================

// api/v1/index.js
const express = require('express');

const router = express.Router();

// Mount all v1 routes
router.use('/users', require('./users/users.routes'));
router.use('/products', require('./products/products.routes'));
router.use('/orders', require('./orders/orders.routes'));
router.use('/crops', require('./crops/crops.routes'));
router.use('/marketplace', require('./marketplace/marketplace.routes'));

module.exports = router;

// api/index.js
const express = require('express');
const v1Routes = require('./v1');

const router = express.Router();

router.use('/v1', v1Routes);

// API documentation
router.get('/', (req, res) => {
  res.json({
    name: 'EBDESIGN API',
    version: '1.0.0',
    endpoints: {
      v1: '/api/v1',
      health: '/health',
      docs: '/docs',
    },
  });
});

module.exports = router;

// ============================================================================
// 10. REFACTORED INDEX.JS
// ============================================================================

// src/index.js (SIMPLIFIED)
require('dotenv').config();

const express = require('express');
const { setupMiddleware } = require('./api/middleware');
const apiRoutes = require('./api');
const { logger } = require('@libs/logger');

const app = express();

// Setup all middleware
setupMiddleware(app);

// Mount API routes
app.use('/api', apiRoutes);

// Health checks
app.get('/health', (req, res) => res.json({ status: 'healthy' }));
app.get('/ready', (req, res) => res.json({ ready: true }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Request error', {
    message: err.message,
    path: req.path,
    method: req.method,
  });

  res.status(err.statusCode || 500).json({
    error: err.message,
    code: err.code || 'INTERNAL_ERROR',
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;

// ============================================================================
// 11. MODULE STRUCTURE (EXAMPLE)
// ============================================================================

// modules/users/index.js
module.exports = {
  UserService: require('./services/userService').UserService,
  UserRepository: require('./repositories/userRepository').UserRepository,
  UserDTO: require('./dto/userDTO').UserDTO,
};

// ============================================================================
// 12. LIBS STRUCTURE
// ============================================================================

// libs/errors/index.js
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

module.exports = { AppError };

// libs/logger/index.js
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

module.exports = { logger };

// libs/cache/index.js
const redis = require('redis');

class CacheService {
  constructor() {
    this.client = redis.createClient();
    this.client.connect();
  }

  async get(key) {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key, value, ttl = 3600) {
    await this.client.setEx(key, ttl, JSON.stringify(value));
  }

  async del(key) {
    await this.client.del(key);
  }
}

module.exports = { CacheService };

// ============================================================================
// SUMMARY
// ============================================================================

console.log(`
REFACTORING COMPLETE - FILE STRUCTURE SUMMARY

Routes:       api/v1/users/users.routes.js
Controllers:  api/v1/users/users.controller.js
DTOs:         api/v1/users/users.dto.js
Validation:   api/v1/users/users.validation.js
Services:     modules/users/services/userService.js
Repository:   modules/users/repositories/userRepository.js
Libs:         libs/errors/, libs/logger/, libs/cache/
Config:       config/index.js, config/registries/
Middleware:   api/middleware/

✅ Clean separation of concerns
✅ Clear layered architecture
✅ Reusable modules
✅ Easy to test
✅ Scalable structure
`);
