/**
 * Farmer Directory Routes
 * API endpoints for farmer profiles, FDI scoring, certifications, and FPOs.
 *
 * farmerService also exposes wallet functions (getFarmerWallet, depositToWallet, etc.) —
 * those are already wired up in farmerPortalEnhancements.js. This file only covers the
 * profile/directory/certification/FPO functions that had no route at all.
 */

const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const apiResponseHandler = require('../middleware/apiResponseHandler');
const {
  getFarmerById,
  getFarmers,
  calculateFDI,
  addFarmerCertification,
  getFarmerCertifications,
  getFPOs
} = require('../services/legacy/farmerService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { resolveFarmerId } = require('../middleware/resolveFarmerId');

// List / search farmers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page, limit, sort_by, sort_order, ...filters } = req.query;
    const result = await getFarmers(filters, { page: Number(page) || 1, limit: Number(limit) || 20, sort_by, sort_order });
    return apiResponseHandler.sendSuccess(res, result, 'Farmers retrieved successfully');
  } catch (error) {
    return apiResponseHandler.sendError(res, 'Failed to retrieve farmers', 500, 'SERVER_ERROR', error.message);
  }
});

// FPO directory
router.get('/fpos/list', authMiddleware, async (req, res) => {
  try {
    const result = await getFPOs(req.query);
    return apiResponseHandler.sendSuccess(res, result, 'FPOs retrieved successfully');
  } catch (error) {
    return apiResponseHandler.sendError(res, 'Failed to retrieve FPOs', 500, 'SERVER_ERROR', error.message);
  }
});

// Current farmer alias.
// FIXED 2026-08-15: previously called getFarmerById(req.user.id) directly —
// getFarmerById queries `WHERE f.id = $1` (farmers.id), but req.user.id is
// a users.id (see middleware/resolveFarmerId.js for the full explanation).
// This endpoint has always returned "Farmer not found" for every real
// farmer.
router.get('/me', authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const farmer = await getFarmerById(req.farmerId);
    res.json({ success: true, data: farmer });
  } catch (error) {
    const status = error.message === 'Farmer not found' ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// Single farmer profile
router.get('/:farmerId', authMiddleware, async (req, res) => {
  try {
    let farmerId = req.params.farmerId;
    if (farmerId === 'me' || farmerId === 'current-farmer-id') {
      const result = await pool.query('SELECT id FROM farmers WHERE user_id = $1', [req.user.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'No farmer profile is associated with this account' });
      }
      farmerId = result.rows[0].id;
    }
    const farmer = await getFarmerById(farmerId);
    res.json({ success: true, data: farmer });
  } catch (error) {
    const status = error.message === 'Farmer not found' ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// Farmer Development Index score
router.post('/:farmerId/fdi', authMiddleware, async (req, res) => {
  try {
    const fdi = await calculateFDI(req.params.farmerId);
    res.json({ success: true, data: fdi });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Certifications
router.get('/:farmerId/certifications', authMiddleware, async (req, res) => {
  try {
    const certifications = await getFarmerCertifications(req.params.farmerId);
    res.json({ success: true, data: certifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// FIXED 2026-08-15: was mounted with only adminMiddleware, which checks
// req.user but never authenticates (middleware/admin.js) — req.user was
// always undefined here, so this endpoint 401'd on every call.
router.post('/:farmerId/certifications', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const certification = await addFarmerCertification(req.params.farmerId, req.body);
    res.status(201).json({ success: true, data: certification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
