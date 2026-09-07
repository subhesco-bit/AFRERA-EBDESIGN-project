'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const service = require('../services/advancedSearchService');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page || '1', 10)));
    const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit || '20', 10)));
    const result = await service.advancedSearch({ ...req.query, page, limit });
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message || 'Search failed' });
  }
});

router.get('/suggestions', async (req, res) => {
  if (!req.query.query || req.query.query.length > 200) {
    return res.status(400).json({ success: false, error: 'query is required and must be at most 200 characters' });
  }
  try {
    const limit = Math.max(1, Math.min(20, Number.parseInt(req.query.limit || '10', 10)));
    res.json(await service.getSearchSuggestions(req.query.query, limit));
  } catch (error) {
    res.status(400).json({ success: false, error: error.message || 'Suggestions unavailable' });
  }
});

module.exports = router;
