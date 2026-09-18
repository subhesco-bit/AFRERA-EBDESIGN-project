/**
 * Real backend route for TransactionHistoryPage.jsx's
 * transactionAPI.getUserTransactions(userId, filters), backed by
 * services/transactionService.js's getUserTransactions(userId, filters).
 * Exact name/shape match; userId is server-derived from the authenticated
 * user rather than trusted from the client, since the page's own
 * placeholder userId ('user123') was never meant to reach production.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/transactionService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/transactions', async (req, res) => {
  try {
    const data = await svc.getUserTransactions(req.user.id, req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
