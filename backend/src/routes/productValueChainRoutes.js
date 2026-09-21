'use strict';

const express = require('express');
const { apiLimiter } = require('../middleware/rateLimiter');
const service = require('../services/productValueChainService');

const router = express.Router();
router.use(apiLimiter);

router.get('/status', (_req, res) => res.json({ success: true, data: service.getStatus() }));

router.post('/analyze', async (req, res) => {
  try {
    const data = await service.analyzeProduct(req.body, { useAI: req.body.useAI !== false, generateImage: req.body.generateImage === true });
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.message === 'Product name is required' ? 400 : 500).json({ success: false, error: error.message });
  }
});

module.exports = router;
