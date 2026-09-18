/**
 * Real backend routes for CropValueReviewPage.jsx, backed by
 * services/legacy/cropValueResearchService.js. getPending ->
 * getPendingSuggestions, review -> reviewSuggestion (name differences);
 * userId filled from the authenticated user.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/cropValueResearchService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/crop-value-research/pending', wrap(() => svc.getPendingSuggestions()));
router.post('/crop-value-research/:id/review', wrap((req) => svc.reviewSuggestion(req.params.id, req.body.approve, req.user.id)));

module.exports = router;
