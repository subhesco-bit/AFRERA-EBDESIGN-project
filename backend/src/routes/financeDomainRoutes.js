/**
 * Real backend routes for BankPassportPage.jsx / LedgerPage.jsx, backed by
 * services/legacy/recoveredFinanceService.js. getMyEnwrReceipts ->
 * listMyEnwrReceipts(farmerId), farmerId filled from the authenticated
 * user. trialBalance/verifyLedger are exact matches.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/recoveredFinanceService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/finance/my-enwr-receipts', wrap((req) => svc.listMyEnwrReceipts(req.user?.id)));
router.get('/finance/trial-balance', wrap(() => svc.trialBalance()));
router.get('/finance/verify-ledger', wrap(() => svc.verifyLedger()));

module.exports = router;
