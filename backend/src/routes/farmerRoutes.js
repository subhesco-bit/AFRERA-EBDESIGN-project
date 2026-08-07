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
const {
  getFarmerById,
  getFarmers,
  calculateFDI,
  addFarmerCertification,
  getFarmerCertifications,
  getFPOs
} = require('../services/farmerService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

// List / search farmers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page, limit, sort_by, sort_order, ...filters } = req.query;
    const result = await getFarmers(filters, { page: Number(page) || 1, limit: Number(limit) || 20, sort_by, sort_order });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// FPO directory
router.get('/fpos/list', authMiddleware, async (req, res) => {
  try {
    const result = await getFPOs(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Current farmer alias
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const farmer = await getFarmerById(req.user.id);
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
      farmerId = req.user.id;
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

router.post('/:farmerId/certifications', adminMiddleware, async (req, res) => {
  try {
    const certification = await addFarmerCertification(req.params.farmerId, req.body);
    res.status(201).json({ success: true, data: certification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
