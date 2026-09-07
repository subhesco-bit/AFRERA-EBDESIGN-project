/**
 * Farmer Value Engine Routes
 * Provides endpoints for revenue ledger, FVI calculations, and value analysis
 */

const express = require('express');
const router = express.Router();
const farmerValueService = require('../services/legacy/farmerValueService');
const { authMiddleware } = require('../middleware/auth');
const apiResponseHandler = require('../middleware/apiResponseHandler');

// Get season revenue ledger for a farmer
router.get('/season-ledger', authMiddleware, async (req, res) => {
  try {
    const { farmerId } = req.user; // Assuming farmerId is in user object
    const { season, year } = req.query;
    const ledger = await farmerValueService.getSeasonLedger(farmerId, season, year);
    apiResponseHandler.sendSuccess(res, ledger);
  } catch (error) {
    apiResponseHandler.sendError(res, error.message);
  }
});

// Calculate Farmer Value Index (FVI)
router.get('/:farmerId/fvi', authMiddleware, async (req, res) => {
  try {
    const { season, year } = req.query;
    const fvi = await farmerValueService.calculateFVI(req.params.farmerId, { season, year });
    apiResponseHandler.sendSuccess(res, fvi);
  } catch (error) {
    apiResponseHandler.sendError(res, error.message);
  }
});

// Detect unclaimed subsidies
router.get('/:farmerId/unclaimed-subsidy', authMiddleware, async (req, res) => {
  try {
    const unclaimed = await farmerValueService.detectUnclaimedSubsidy(req.params.farmerId);
    apiResponseHandler.sendSuccess(res, unclaimed);
  } catch (error) {
    apiResponseHandler.sendError(res, error.message);
  }
});

// Get FVI history
router.get('/:farmerId/fvi-history', authMiddleware, async (req, res) => {
  try {
    const history = await farmerValueService.getFVIHistory(req.params.farmerId);
    apiResponseHandler.sendSuccess(res, history);
  } catch (error) {
    apiResponseHandler.sendError(res, error.message);
  }
});

module.exports = router;
