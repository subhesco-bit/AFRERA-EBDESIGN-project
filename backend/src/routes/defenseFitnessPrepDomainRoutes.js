/**
 * Real backend routes for DefenseFitnessPrepPage.jsx, backed by
 * services/legacy/defenseFitnessPrepService.js. getCategories ->
 * getStandardCategories (name diff); getReadiness/recordAttempt need
 * userId, filled from the authenticated user.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/defenseFitnessPrepService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/defense-fitness-prep/categories', wrap(() => svc.getStandardCategories()));
router.get('/defense-fitness-prep/readiness/:category', wrap((req) => svc.getReadinessComparison(req.user.id, req.params.category, req.query.gender)));
router.post('/defense-fitness-prep/attempt', wrap((req) => svc.recordAttempt(req.user.id, req.body.category, req.body.testComponent, req.body.value, req.body.source || 'manual')));

module.exports = router;
