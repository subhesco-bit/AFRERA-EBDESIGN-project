/**
 * SKELETON MODULE GENERATOR
 * Generates complete skeleton modules for rapid implementation
 * Creates service, controller, routes, model, and test files
 *
 * Usage: node SKELETON_MODULE_GENERATOR.js M031 "Supply Chain Coordination"
 */

const fs = require('fs');
const path = require('path');

class SkeletonModuleGenerator {
  constructor(moduleId, moduleName) {
    this.moduleId = moduleId;
    this.moduleName = moduleName;
    this.modulePath = path.join(__dirname, 'backend/src/modules', moduleId);
    this.camelCaseName = this.toCamelCase(moduleName);
    this.pascalCaseName = this.toPascalCase(moduleName);
    this.snakeCaseName = this.toSnakeCase(moduleName);
  }

  toCamelCase(str) {
    return str
      .toLowerCase()
      .split(' ')
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  toPascalCase(str) {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  toSnakeCase(str) {
    return str.toLowerCase().split(' ').join('_');
  }

  generateService() {
    return `/**
 * ${this.pascalCaseName} Service
 * Module: ${this.moduleId}
 * Business logic for ${this.moduleName}
 */

const { logger } = require('../../utils/logger');
const db = require('../../database/connection');

class ${this.pascalCaseName}Service {
  constructor() {
    this.tableName = '${this.snakeCaseName}';
  }

  /**
   * Get all ${this.snakeCaseName} records
   */
  async getAll(filters = {}) {
    try {
      logger.info('📖 Getting all ${this.snakeCaseName}');

      const query = \`
        SELECT * FROM \${this.tableName}
        WHERE 1=1
        \${filters.status ? 'AND status = \\$1' : ''}
        ORDER BY created_at DESC
      \`;

      const result = await db.query(query, filters.status ? [filters.status] : []);
      return result.rows;
    } catch (error) {
      logger.error('❌ Error getting ${this.snakeCaseName}:', error.message);
      throw error;
    }
  }

  /**
   * Get ${this.snakeCaseName} by ID
   */
  async getById(id) {
    try {
      logger.info('📖 Getting ${this.snakeCaseName} by ID:', id);

      const query = \`SELECT * FROM \${this.tableName} WHERE id = $1\`;
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error(\`${this.pascalCaseName} not found: \${id}\`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error getting ${this.snakeCaseName}:', error.message);
      throw error;
    }
  }

  /**
   * Create new ${this.snakeCaseName}
   */
  async create(data) {
    try {
      logger.info('✏️  Creating new ${this.snakeCaseName}', data);

      const query = \`
        INSERT INTO \${this.tableName} (
          \${Object.keys(data).join(', ')}
        ) VALUES (
          \${Object.keys(data).map((_, i) => \`$\${i + 1}\`).join(', ')}
        ) RETURNING *
      \`;

      const result = await db.query(query, Object.values(data));
      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error creating ${this.snakeCaseName}:', error.message);
      throw error;
    }
  }

  /**
   * Update ${this.snakeCaseName}
   */
  async update(id, data) {
    try {
      logger.info('✏️  Updating ${this.snakeCaseName}:', id);

      const updates = Object.keys(data)
        .map((key, i) => \`\${key} = $\${i + 1}\`)
        .join(', ');

      const query = \`
        UPDATE \${this.tableName}
        SET \${updates}, updated_at = NOW()
        WHERE id = $\${Object.keys(data).length + 1}
        RETURNING *
      \`;

      const result = await db.query(query, [...Object.values(data), id]);

      if (result.rows.length === 0) {
        throw new Error(\`${this.pascalCaseName} not found: \${id}\`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error updating ${this.snakeCaseName}:', error.message);
      throw error;
    }
  }

  /**
   * Delete ${this.snakeCaseName}
   */
  async delete(id) {
    try {
      logger.info('🗑️  Deleting ${this.snakeCaseName}:', id);

      const query = \`DELETE FROM \${this.tableName} WHERE id = $1 RETURNING *\`;
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error(\`${this.pascalCaseName} not found: \${id}\`);
      }

      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error deleting ${this.snakeCaseName}:', error.message);
      throw error;
    }
  }

  /**
   * Search ${this.snakeCaseName}
   */
  async search(query, limit = 10) {
    try {
      logger.info('🔍 Searching ${this.snakeCaseName}:', query);

      const searchQuery = \`
        SELECT * FROM \${this.tableName}
        WHERE name ILIKE $1 OR description ILIKE $1
        LIMIT $2
      \`;

      const result = await db.query(searchQuery, [\`%\${query}%\`, limit]);
      return result.rows;
    } catch (error) {
      logger.error('❌ Error searching ${this.snakeCaseName}:', error.message);
      throw error;
    }
  }
}

module.exports = new ${this.pascalCaseName}Service();
`;
  }

  generateController() {
    return `/**
 * ${this.pascalCaseName} Controller
 * Module: ${this.moduleId}
 * Request handlers for ${this.moduleName}
 */

const { logger } = require('../../utils/logger');
const ${this.camelCaseName}Service = require('./service');

class ${this.pascalCaseName}Controller {
  /**
   * GET - Get all ${this.snakeCaseName}
   */
  async getAll(req, res) {
    try {
      const filters = req.query;
      const data = await ${this.camelCaseName}Service.getAll(filters);

      res.json({
        success: true,
        count: data.length,
        data,
      });
    } catch (error) {
      logger.error('❌ Error in getAll:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET - Get ${this.snakeCaseName} by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await ${this.camelCaseName}Service.getById(id);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('❌ Error in getById:', error.message);
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * POST - Create new ${this.snakeCaseName}
   */
  async create(req, res) {
    try {
      const data = await ${this.camelCaseName}Service.create(req.body);

      res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('❌ Error in create:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * PUT - Update ${this.snakeCaseName}
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await ${this.camelCaseName}Service.update(id, req.body);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('❌ Error in update:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE - Delete ${this.snakeCaseName}
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const data = await ${this.camelCaseName}Service.delete(id);

      res.json({
        success: true,
        message: '${this.pascalCaseName} deleted',
        data,
      });
    } catch (error) {
      logger.error('❌ Error in delete:', error.message);
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * POST - Search ${this.snakeCaseName}
   */
  async search(req, res) {
    try {
      const { query, limit = 10 } = req.body;
      const data = await ${this.camelCaseName}Service.search(query, limit);

      res.json({
        success: true,
        count: data.length,
        data,
      });
    } catch (error) {
      logger.error('❌ Error in search:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ${this.pascalCaseName}Controller();
`;
  }

  generateRoutes() {
    return `/**
 * ${this.pascalCaseName} Routes
 * Module: ${this.moduleId}
 */

const express = require('express');
const router = express.Router();
const ${this.camelCaseName}Controller = require('./controller');
const { authenticate } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/authorizationMiddleware');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/${this.snakeCaseName}
 * Get all ${this.snakeCaseName}
 */
router.get('/', ${this.camelCaseName}Controller.getAll.bind(${this.camelCaseName}Controller));

/**
 * GET /api/${this.snakeCaseName}/:id
 * Get ${this.snakeCaseName} by ID
 */
router.get('/:id', ${this.camelCaseName}Controller.getById.bind(${this.camelCaseName}Controller));

/**
 * POST /api/${this.snakeCaseName}
 * Create new ${this.snakeCaseName}
 */
router.post(
  '/',
  authorize(['admin', 'manager']),
  ${this.camelCaseName}Controller.create.bind(${this.camelCaseName}Controller)
);

/**
 * PUT /api/${this.snakeCaseName}/:id
 * Update ${this.snakeCaseName}
 */
router.put(
  '/:id',
  authorize(['admin', 'manager']),
  ${this.camelCaseName}Controller.update.bind(${this.camelCaseName}Controller)
);

/**
 * DELETE /api/${this.snakeCaseName}/:id
 * Delete ${this.snakeCaseName}
 */
router.delete(
  '/:id',
  authorize(['admin']),
  ${this.camelCaseName}Controller.delete.bind(${this.camelCaseName}Controller)
);

/**
 * POST /api/${this.snakeCaseName}/search
 * Search ${this.snakeCaseName}
 */
router.post('/search', ${this.camelCaseName}Controller.search.bind(${this.camelCaseName}Controller));

module.exports = router;
`;
  }

  generateModel() {
    return `/**
 * ${this.pascalCaseName} Database Model
 * Module: ${this.moduleId}
 */

const model = {
  tableName: '${this.snakeCaseName}',
  schema: {
    id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    user_id: 'UUID NOT NULL REFERENCES users(id)',
    name: 'VARCHAR(255) NOT NULL',
    description: 'TEXT',
    status: "VARCHAR(50) DEFAULT 'active'",
    data: 'JSONB',
    created_at: 'TIMESTAMP DEFAULT NOW()',
    updated_at: 'TIMESTAMP DEFAULT NOW()',
    deleted_at: 'TIMESTAMP',
  },
  indexes: [
    'CREATE INDEX idx_${this.snakeCaseName}_user_id ON ${this.snakeCaseName}(user_id)',
    'CREATE INDEX idx_${this.snakeCaseName}_status ON ${this.snakeCaseName}(status)',
    'CREATE INDEX idx_${this.snakeCaseName}_created_at ON ${this.snakeCaseName}(created_at)',
  ],
};

module.exports = model;
`;
  }

  generateTest() {
    return `/**
 * ${this.pascalCaseName} Tests
 * Module: ${this.moduleId}
 */

const ${this.camelCaseName}Service = require('./service');

describe('${this.pascalCaseName}Service', () => {
  let testId;

  test('should create ${this.snakeCaseName}', async () => {
    const data = {
      name: 'Test ${this.pascalCaseName}',
      description: 'Test description',
    };

    const result = await ${this.camelCaseName}Service.create(data);
    expect(result).toHaveProperty('id');
    testId = result.id;
  });

  test('should get ${this.snakeCaseName} by ID', async () => {
    const result = await ${this.camelCaseName}Service.getById(testId);
    expect(result).toHaveProperty('id', testId);
  });

  test('should get all ${this.snakeCaseName}', async () => {
    const result = await ${this.camelCaseName}Service.getAll();
    expect(Array.isArray(result)).toBe(true);
  });

  test('should update ${this.snakeCaseName}', async () => {
    const updated = await ${this.camelCaseName}Service.update(testId, {
      name: 'Updated ${this.pascalCaseName}',
    });
    expect(updated.name).toBe('Updated ${this.pascalCaseName}');
  });

  test('should search ${this.snakeCaseName}', async () => {
    const result = await ${this.camelCaseName}Service.search('Test');
    expect(Array.isArray(result)).toBe(true);
  });

  test('should delete ${this.snakeCaseName}', async () => {
    const result = await ${this.camelCaseName}Service.delete(testId);
    expect(result).toHaveProperty('id', testId);
  });
});
`;
  }

  generateREADME() {
    return `# ${this.pascalCaseName} Module

**Module ID:** ${this.moduleId}
**Name:** ${this.moduleName}
**Created:** ${new Date().toISOString()}

## Overview
Implementation of ${this.moduleName} functionality.

## Structure
- \`service.js\` - Business logic
- \`controller.js\` - Request handlers
- \`routes.js\` - Express routes
- \`model.js\` - Database schema
- \`${this.snakeCaseName}.test.js\` - Unit tests

## API Endpoints
- \`GET /api/${this.snakeCaseName}\` - Get all
- \`GET /api/${this.snakeCaseName}/:id\` - Get by ID
- \`POST /api/${this.snakeCaseName}\` - Create
- \`PUT /api/${this.snakeCaseName}/:id\` - Update
- \`DELETE /api/${this.snakeCaseName}/:id\` - Delete
- \`POST /api/${this.snakeCaseName}/search\` - Search

## Status
✅ Scaffolding complete
⏳ Implementation pending
❌ Tests pending

## Next Steps
1. Implement business logic in \`service.js\`
2. Update database schema in \`model.js\`
3. Test all endpoints
4. Add validation and error handling

## Estimated Effort
15-20 hours
`;
  }

  async generate() {
    try {
      // Create module directory
      if (!fs.existsSync(this.modulePath)) {
        fs.mkdirSync(this.modulePath, { recursive: true });
        console.log(`✅ Created directory: ${this.modulePath}`);
      }

      // Generate files
      const files = {
        'service.js': this.generateService(),
        'controller.js': this.generateController(),
        'routes.js': this.generateRoutes(),
        'model.js': this.generateModel(),
        [`${this.snakeCaseName}.test.js`]: this.generateTest(),
        'README.md': this.generateREADME(),
      };

      for (const [filename, content] of Object.entries(files)) {
        const filepath = path.join(this.modulePath, filename);
        fs.writeFileSync(filepath, content);
        console.log(`✅ Created: ${filename}`);
      }

      console.log(`\n✅ Module ${this.moduleId} scaffolded successfully!`);
      console.log(`📁 Location: ${this.modulePath}`);
      console.log(`⏱️  Estimated effort: 15-20 hours`);

      return true;
    } catch (error) {
      console.error(`❌ Error generating module: ${error.message}`);
      return false;
    }
  }
}

// CLI Usage
if (require.main === module) {
  const moduleId = process.argv[2] || 'M031';
  const moduleName = process.argv[3] || 'Sample Module';

  const generator = new SkeletonModuleGenerator(moduleId, moduleName);
  generator.generate();
}

module.exports = SkeletonModuleGenerator;
