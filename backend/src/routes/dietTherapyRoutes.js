'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const service = require('../services/dietTherapyService');

router.use(authMiddleware);

router.post('/plan', async (req, res) => {
  try {
    const result = await service.createPlan(req.body.profile, req.body.options);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/regional-food-groups', (req, res) => {
  const region = String(req.query.region || 'northeast').toLowerCase();
  res.json({ success: true, data: { region, food_groups: service.REGIONAL_STAPLES[region] || service.REGIONAL_STAPLES.northeast } });
});

module.exports = router;
