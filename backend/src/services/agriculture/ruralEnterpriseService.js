const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

// ruralEnterpriseService — minimal in-memory scaffold.
let _items = [];
let _nextId = 1;

router.get('/', async (req, res) => {
  try {
    const pg = getPostgreSQL();
    if (pg && false) {
      const result = await pg.query('SELECT * FROM _placeholder ORDER BY created_at DESC LIMIT 100');
      return res.json({ success: true, data: result.rows });
    }
    res.json({ success: true, data: _items });
  } catch (error) {
    logger.warn('ruralEnterpriseService list query failed, falling back to in-memory store', { error: error.message });
    res.json({ success: true, data: _items });
  }
});

router.post('/', authMiddleware, (req, res) => {
  const item = { id: _nextId++, ...req.body, created_at: new Date().toISOString() };
  _items.push(item);
  res.status(201).json({ success: true, data: item });
});

function setupRoutes(app) {
  app.use('/api/v1/rural-enterprise', router);
}

module.exports = { router, setupRoutes };
