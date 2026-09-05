/**
 * Asset Accounting Routes — AF-AA.
 * Fixed asset register, straight-line depreciation schedules and disposal.
 * See backend/src/services/assetAccountingService.js for scope notes.
 */

const express = require('express');
const router = express.Router();
const assetAccountingService = require('../services/legacy/assetAccountingService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { authRateLimit } = require('../middleware/rateLimiter');

// Fixed Asset Register
router.post('/assets', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const asset = await assetAccountingService.createAsset(req.body);
    res.json({ success: true, data: asset });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/assets', authMiddleware, async (req, res) => {
  try {
    const { companyId, ...filters } = req.query;
    const assets = await assetAccountingService.getAssets(companyId, filters);
    res.json({ success: true, data: assets });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/assets/summary', authMiddleware, async (req, res) => {
  try {
    const summary = await assetAccountingService.getAssetRegisterSummary(req.query.companyId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/assets/:assetId', authMiddleware, async (req, res) => {
  try {
    let asset = await assetAccountingService.getAsset(req.params.assetId);
    res.json({ success: true, data: asset });
  } catch (error) {
    res.status(error.message === 'Fixed asset not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

// Depreciation
router.post('/assets/:assetId/depreciation-schedule', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const schedule = await assetAccountingService.generateDepreciationSchedule(req.params.assetId);
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/assets/:assetId/depreciation-schedule', authMiddleware, async (req, res) => {
  try {
    let schedule = await assetAccountingService.getDepreciationSchedule(req.params.assetId);
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/assets/:assetId/depreciation-schedule/:periodDate/post', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await assetAccountingService.postDepreciationPeriod(req.params.assetId, req.params.periodDate);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/depreciation-run', authRateLimit, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { companyId, asOfDate } = req.body;
    let result = await assetAccountingService.runDepreciationForPeriod(companyId, asOfDate);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Disposal
router.post('/assets/:assetId/dispose', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let result = await assetAccountingService.disposeAsset(req.params.assetId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
