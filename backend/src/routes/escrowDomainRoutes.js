/**
 * Real backend routes for EscrowPage.jsx, backed by
 * services/legacy/escrowService.js. list -> getUserEscrowTransactions
 * (userId from auth), refund -> refundEscrowFunds, release ->
 * releaseEscrowFunds (name differences).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/escrowService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/escrow/list', wrap((req) => svc.getUserEscrowTransactions(req.user.id, req.query.role)));
router.post('/escrow/:escrowId/release', wrap((req) => svc.releaseEscrowFunds(req.params.escrowId, req.body)));
router.post('/escrow/:escrowId/refund', wrap((req) => svc.refundEscrowFunds(req.params.escrowId, req.body?.reason)));

module.exports = router;
