/**
 * Real backend routes for LoanManagementPage.jsx, backed by
 * services/claude/financialAIService.js. Only getLoans is wired here -
 * getCreditScore ('current-farmer-id' is a literal placeholder string in
 * the page, not a real id) and getOverview have no confident real match,
 * not wired.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/claude/financialAIService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/financial/loans', wrap((req) => svc.getFarmerLoans(req.user.id, req.query)));

module.exports = router;
