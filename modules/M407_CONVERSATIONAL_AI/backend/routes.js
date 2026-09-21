/**
 * M407_CONVERSATIONAL_AI Routes
 */

'use strict';

const express = require('express');
const router = express.Router();
const service = require('./service');
const { logger } = require('../../../backend/src/utils/logger');

router.post('/process', async (req, res) => {
  try {
    const { capability, data, provider } = req.body;
    if (!capability || !data) return res.status(400).json({ success: false, error: 'Missing required fields' });
    
    const result = await service.process({ capability, data, provider });
    res.json(result);
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/capabilities', (req, res) => {
  const svc = service.getInstance();
  res.json({ success: true, moduleId: svc.moduleId, name: svc.name, capabilities: svc.capabilities });
});

router.get('/metrics', (req, res) => {
  res.json({ success: true, metrics: service.getMetrics() });
});

module.exports = router;
