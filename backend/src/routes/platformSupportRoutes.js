'use strict';

/**
 * Platform Support Orchestrator routes.
 * Auto-mounts at /api/v1/platform-support
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const orch = require('../services/legacy/platformSupportOrchestratorService');

const router = express.Router();

router.get('/capabilities', authMiddleware, (req, res) => {
  try {
    res.json({ success: true, data: orch.getCapabilities() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/desk', authMiddleware, async (req, res) => {
  try {
    const data = await orch.buildSupportDesk({
      userId: req.user.id,
      productId: req.body.productId || null,
      farmerId: req.body.farmerId || null,
      queryText: req.body.query || req.body.text || '',
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 'DESK_FAILED' });
  }
});

router.post('/execute', authMiddleware, async (req, res) => {
  try {
    const data = await orch.executeRoutedSupport({
      userId: req.user.id,
      isAdmin: req.user.role === 'admin',
      queryText: req.body.query || req.body.text,
      species: req.body.species,
      packId: req.body.packId,
      symptoms: req.body.symptoms,
      photoDescription: req.body.photoDescription,
      imageUrl: req.body.imageUrl,
      sessionId: req.body.sessionId,
      facilityType: req.body.facilityType,
      structuralInputs: req.body.structuralInputs,
      capacityInputs: req.body.capacityInputs,
      state: req.body.state,
      projectId: req.body.projectId,
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message, code: 'EXECUTE_FAILED' });
  }
});

module.exports = router;
