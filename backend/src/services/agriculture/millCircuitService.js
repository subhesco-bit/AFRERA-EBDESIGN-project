const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');

// millCircuitService — minimal scaffold.
router.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});

function isHealthy() {
  return { status: 'ok' };
}

module.exports = { router, isHealthy };
