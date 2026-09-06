/**
 * Cooperative Share Routes — FPO member share capital + patronage dividend.
 * See services/cooperativeShareService.js for the real patronage-volume
 * calculation this backs.
 */

const express = require('express');
const router = express.Router();
const cooperativeShareService = require('../services/legacy/cooperativeShareService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

router.post('/members', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const member = await cooperativeShareService.addMember(req.body || {});
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/members', authMiddleware, async (req, res) => {
  try {
    const { fpoId } = req.query;
    const members = await cooperativeShareService.listMembers(fpoId);
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/capital', authMiddleware, async (req, res) => {
  try {
    const { fpoId } = req.query;
    const capital = await cooperativeShareService.getPaidUpCapital(fpoId);
    res.json({ success: true, data: capital });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/distributions/preview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const preview = await cooperativeShareService.computeDistribution(req.body || {});
    res.json({ success: true, data: preview });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/distributions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const distribution = await cooperativeShareService.createDistribution({
      ...req.body, computedBy: req.user?.id,
    });
    res.status(201).json({ success: true, data: distribution });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/distributions', authMiddleware, async (req, res) => {
  try {
    const { fpoId } = req.query;
    const distributions = await cooperativeShareService.listDistributions(fpoId);
    res.json({ success: true, data: distributions });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/distributions/:id', authMiddleware, async (req, res) => {
  try {
    const distribution = await cooperativeShareService.getDistribution(req.params.id);
    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

module.exports = router;
