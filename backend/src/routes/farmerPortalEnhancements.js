/**
 * Farmer Portal Enhancement Routes
 * API endpoints for Land Records, Crop Planning, and Wallet
 */

const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const landRecordsService = require('../services/legacy/landRecordsService');
const cropPlanningService = require('../services/legacy/cropPlanningService');
const { getFarmerWallet, getWalletTransactions, depositToWallet, withdrawFromWallet, transferFromWallet, getWalletBalance, linkBankAccount } = require('../services/legacy/farmerService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { authRateLimit } = require('../middleware/rateLimiter');

/**
 * FIXED 2026-08-15: every route below previously passed req.user.id (a
 * users.id) directly into land_records/crop_plans/farmer_wallets queries
 * that filter on farmer_id, a DIFFERENT UUID (farmers.id, per
 * 011_farmer_portal_enhancements.sql: `farmer_id UUID NOT NULL REFERENCES
 * farmers(id)`). authMiddleware only ever sets req.user = { id, email,
 * role, permissions } (see middleware/auth.js) — there is no farmer_id
 * resolution anywhere in the auth path. For any real farmer account,
 * every one of these endpoints was operating against the wrong identity:
 * land records and crop plans would either match nothing or silently
 * create/query rows keyed by a UUID with no corresponding farmers row,
 * and the wallet functions auto-create a *new*, disconnected wallet on
 * every call since the lookup never matches the farmer's real one. This
 * affected LandRecords.jsx, which has been mounted in production
 * (FarmerPortalPage.jsx) since 2026-08-07.
 *
 * This middleware resolves the real farmers.id for the authenticated
 * user once, and every route below now uses req.farmerId instead of
 * req.user.id for farmer-scoped operations (req.user.id/req.user.role
 * are still used correctly where the actual authenticated *user* — e.g.
 * an admin verifying a record — is what's needed, not the farmer).
 */
async function resolveFarmerId(req, res, next) {
  try {
    const result = await pool.query('SELECT id FROM farmers WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No farmer profile is associated with this account' });
    }
    req.farmerId = result.rows[0].id;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Land Records Routes
router.post('/land-records', authRateLimit, authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const landRecord = await landRecordsService.addLandRecord(req.farmerId, req.body);
    res.json({ success: true, data: landRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/land-records', authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const landRecords = await landRecordsService.getFarmerLandRecords(req.farmerId, req.query);
    res.json({ success: true, data: landRecords });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/land-records/:recordId', authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const { recordId } = req.params;
    let landRecord = await landRecordsService.getLandRecord(recordId, req.farmerId, req.user.role === 'admin');
    res.json({ success: true, data: landRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/land-records/:recordId', authRateLimit, authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const { recordId } = req.params;
    let landRecord = await landRecordsService.updateLandRecord(recordId, req.farmerId, req.body);
    res.json({ success: true, data: landRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// FIXED: this route was mounted with only adminMiddleware, which checks
// `if (!req.user)` for authorization but never authenticates — it has no
// token-verification logic of its own (see middleware/admin.js). Without
// authMiddleware running first, req.user was always undefined here, so
// this endpoint 401'd on every single call regardless of who requested
// it. verifyLandRecord's second param is correctly the ADMIN's own
// req.user.id (they're verifying on the platform's behalf, not acting as
// a farmer), so no resolveFarmerId is needed here.
router.put('/land-records/:recordId/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { recordId } = req.params;
    let landRecord = await landRecordsService.verifyLandRecord(recordId, req.user.id, req.body);
    res.json({ success: true, data: landRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/land-records/sync-government', authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const syncResult = await landRecordsService.syncWithGovernmentLandRecords(req.farmerId);
    res.json({ success: true, data: syncResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/land-records/statistics/region', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await landRecordsService.getRegionalLandStatistics(req.query);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/land-records/:recordId', authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const { recordId } = req.params;
    let result = await landRecordsService.deleteLandRecord(recordId, req.farmerId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crop Planning Routes
router.post('/crop-plans', authRateLimit, authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const cropPlan = await cropPlanningService.createCropPlan(req.farmerId, req.body);
    res.json({ success: true, data: cropPlan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/crop-plans', authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const cropPlans = await cropPlanningService.getFarmerCropPlans(req.farmerId, req.query);
    res.json({ success: true, data: cropPlans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/crop-plans/recommendations/:landRecordId', authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const { landRecordId } = req.params;
    const recommendations = await cropPlanningService.getRecommendedCropPlan(req.farmerId, landRecordId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/crop-plans/:planId/status', authRateLimit, authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const { planId } = req.params;
    const { status, ...updateData } = req.body;
    let cropPlan = await cropPlanningService.updateCropPlanStatus(planId, req.farmerId, status, updateData);
    res.json({ success: true, data: cropPlan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/crop-plans/analytics', authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const analytics = await cropPlanningService.getCropPlanningAnalytics(req.farmerId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Wallet Routes
router.get('/wallet', authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const wallet = await getFarmerWallet(req.farmerId);
    res.json({ success: true, data: wallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wallet/transactions', authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const transactions = await getWalletTransactions(req.farmerId, req.query);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/deposit', authRateLimit, authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const { amount, paymentMethod, reference } = req.body;
    const transaction = await depositToWallet(req.farmerId, amount, paymentMethod, reference);
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/withdraw', authRateLimit, authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const { amount, bankAccount, reference } = req.body;
    let transaction = await withdrawFromWallet(req.farmerId, amount, bankAccount, reference);
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/transfer', authRateLimit, authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const { recipientId, amount, description } = req.body;
    let transaction = await transferFromWallet(req.farmerId, recipientId, amount, description);
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wallet/balance', authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const balance = await getWalletBalance(req.farmerId);
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/link-bank', authRateLimit, authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const { bankName, accountNumber, ifscCode, accountHolder } = req.body;
    let result = await linkBankAccount(req.farmerId, bankName, accountNumber, ifscCode, accountHolder);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
