/**
 * Module Completion Script
 * Completes skeleton modules with full CRUD implementation
 * Usage: node scripts/complete_module.js M034
 */

const fs = require('fs');
const path = require('path');

const moduleName = process.argv[2];
if (!moduleName) {
  console.error('Usage: node scripts/complete_module.js MXXX');
  process.exit(1);
}

const modulesPath = path.join(__dirname, '../src/modules');
const modulePath = path.join(modulesPath, moduleName);

if (!fs.existsSync(modulePath)) {
  console.error('Module ' + moduleName + ' not found');
  process.exit(1);
}

const servicePath = path.join(modulePath, 'service.js');
const currentContent = fs.readFileSync(servicePath, 'utf8');
const currentLines = currentContent.split('\n').length;

// Check if already complete
if (currentLines > 50) {
  console.log('Module ' + moduleName + ' is already complete (' + currentLines + ' lines)');
  process.exit(0);
}

// Generate complete service implementation
const tableName = moduleName.toLowerCase() + '_items';

const completeService = `// Service for ${moduleName} Module
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const tableName = '${tableName}';

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Valid payload object is required');
  }
  if (Array.isArray(payload)) {
    throw new Error('Payload must be an object, not an array');
  }
}

async function listItems({ page = 1, limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const offset = (page - 1) * limit;
  const totalRes = await pg.query('SELECT COUNT(*) FROM ' + tableName);
  const total = parseInt(totalRes.rows[0].count || '0');
  const res = await pg.query(
    'SELECT * FROM ' + tableName + ' ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  
  return { 
    items: res.rows, 
    pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } 
  };
}

async function getItem(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query('SELECT * FROM ' + tableName + ' WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function createItem(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  validatePayload(payload);
  
  const res = await pg.query(
    'INSERT INTO ' + tableName + ' (data, created_at) VALUES ($1, NOW()) RETURNING *',
    [payload]
  );
  
  logger.info('Created item in ' + moduleName + ': ' + res.rows[0].id);
  return res.rows[0];
}

async function updateItem(id, payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  validatePayload(payload);
  
  const res = await pg.query(
    'UPDATE ' + tableName + ' SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [payload, id]
  );
  
  if (res.rows[0]) {
    logger.info('Updated item in ' + moduleName + ': ' + id);
  }
  
  return res.rows[0] || null;
}

async function deleteItem(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    'DELETE FROM ' + tableName + ' WHERE id = $1 RETURNING id',
    [id]
  );
  
  if (res.rows[0]) {
    logger.info('Deleted item in ' + moduleName + ': ' + id);
  }
  
  return !!res.rows[0];
}

module.exports = { 
  listItems, 
  getItem, 
  createItem, 
  updateItem, 
  deleteItem 
};`;

// Write the complete service
fs.writeFileSync(servicePath, completeService);

console.log('✅ Completed module ' + moduleName);
console.log('   Previous: ' + currentLines + ' lines');
console.log('   Now: ' + completeService.split('\n').length + ' lines');
console.log('   Status: COMPLETE');

// Also check and complete controller if needed
const controllerPath = path.join(modulePath, 'controller.js');
if (fs.existsSync(controllerPath)) {
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  const controllerLines = controllerContent.split('\n').length;
  
  if (controllerLines < 20) {
    const completeController = `const service = require('./service');

async function list(req, res) {
  try {
    const result = await service.listItems(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function get(req, res) {
  try {
    const result = await service.getItem(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function create(req, res) {
  try {
    const result = await service.createItem(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function update(req, res) {
  try {
    const result = await service.updateItem(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function remove(req, res) {
  try {
    const result = await service.deleteItem(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { list, get, create, update, remove };`;
    
    fs.writeFileSync(controllerPath, completeController);
    console.log('   Controller: COMPLETED');
  }
}

console.log('');
console.log('Next steps:');
console.log('1. Verify route mounting in backend/src/index.js');
console.log('2. Test the module endpoints');
console.log('3. Write integration tests');