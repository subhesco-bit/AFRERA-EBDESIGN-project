const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { logger } = require('../../utils/logger');

// aiAdvisoryService — minimal in-memory scaffold.
let _items = [];
let _nextId = 1;

router.get('/', async (req, res) => {
  res.json({ success: true, data: _items, storage: 'ephemeral_in_memory', authoritative: false });
});

router.post('/', authMiddleware, (req, res) => {
  const item = { id: _nextId++, ...req.body, created_at: new Date().toISOString() };
  _items.push(item);
  res.status(201).json({ success: true, data: item });
});

function setupRoutes(app) {
  app.use('/api/v1/ai-advisory', router);
}

module.exports = { router, setupRoutes };
