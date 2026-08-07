/**
 * Farmer Portal Enhancement Routes
 * API endpoints for Land Records, Crop Planning, and Wallet
 */

const express = require('express');
const router = express.Router();
const landRecordsService = require('../services/landRecordsService');
const cropPlanningService = require('../services/cropPlanningService');
const { getFarmerWallet, getWalletTransactions, depositToWallet, withdrawFromWallet, transferFromWallet, getWalletBalance, linkBankAccount } = require('../services/farmerService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { authRateLimit } = require('../middleware/rateLimiter');

// Land Records Routes
router.post('/land-records', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const landRecord = await landRecordsService.addLandRecord(req.user.id, req.body);
    res.json({ success: true, data: landRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/land-records', authMiddleware, async (req, res) => {
  try {
    const landRecords = await landRecordsService.getFarmerLandRecords(req.user.id, req.query);
    res.json({ success: true, data: landRecords });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/land-records/:recordId', authMiddleware, async (req, res) => {
  try {
    const { recordId } = req.params;
    const landRecord = await landRecordsService.getLandRecord(recordId, req.user.id, req.user.role === 'admin');
    res.json({ success: true, data: landRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/land-records/:recordId', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { recordId } = req.params;
    const landRecord = await landRecordsService.updateLandRecord(recordId, req.user.id, req.body);
    res.json({ success: true, data: landRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/land-records/:recordId/verify', adminMiddleware, async (req, res) => {
  try {
    const { recordId } = req.params;
    const landRecord = await landRecordsService.verifyLandRecord(recordId, req.user.id, req.body);
    res.json({ success: true, data: landRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/land-records/sync-government', authMiddleware, async (req, res) => {
  try {
    const syncResult = await landRecordsService.syncWithGovernmentLandRecords(req.user.id);
    res.json({ success: true, data: syncResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/land-records/statistics/region', adminMiddleware, async (req, res) => {
  try {
    const stats = await landRecordsService.getRegionalLandStatistics(req.query);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/land-records/:recordId', authMiddleware, async (req, res) => {
  try {
    const { recordId } = req.params;
    const result = await landRecordsService.deleteLandRecord(recordId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crop Planning Routes
router.post('/crop-plans', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const cropPlan = await cropPlanningService.createCropPlan(req.user.id, req.body);
    res.json({ success: true, data: cropPlan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/crop-plans', authMiddleware, async (req, res) => {
  try {
    const cropPlans = await cropPlanningService.getFarmerCropPlans(req.user.id, req.query);
    res.json({ success: true, data: cropPlans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/crop-plans/recommendations/:landRecordId', authMiddleware, async (req, res) => {
  try {
    const { landRecordId } = req.params;
    const recommendations = await cropPlanningService.getRecommendedCropPlan(req.user.id, landRecordId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/crop-plans/:planId/status', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { planId } = req.params;
    const { status, ...updateData } = req.body;
    const cropPlan = await cropPlanningService.updateCropPlanStatus(planId, req.user.id, status, updateData);
    res.json({ success: true, data: cropPlan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/crop-plans/analytics', authMiddleware, async (req, res) => {
  try {
    const analytics = await cropPlanningService.getCropPlanningAnalytics(req.user.id);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Wallet Routes
router.get('/wallet', authMiddleware, async (req, res) => {
  try {
    const wallet = await getFarmerWallet(req.user.id);
    res.json({ success: true, data: wallet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wallet/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await getWalletTransactions(req.user.id, req.query);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/deposit', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { amount, paymentMethod, reference } = req.body;
    const transaction = await depositToWallet(req.user.id, amount, paymentMethod, reference);
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/withdraw', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { amount, bankAccount, reference } = req.body;
    const transaction = await withdrawFromWallet(req.user.id, amount, bankAccount, reference);
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/transfer', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { recipientId, amount, description } = req.body;
    const transaction = await transferFromWallet(req.user.id, recipientId, amount, description);
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wallet/balance', authMiddleware, async (req, res) => {
  try {
    const balance = await getWalletBalance(req.user.id);
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/link-bank', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { bankName, accountNumber, ifscCode, accountHolder } = req.body;
    const result = await linkBankAccount(req.user.id, bankName, accountNumber, ifscCode, accountHolder);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
