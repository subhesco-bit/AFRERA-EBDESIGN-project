'use strict';

/**
 * Farmer Support Clinic routes — multi-specialist AI doctor/scientist triage.
 * Auto-mounts at /api/v1/farmer-support-clinic.
 *
 * POST /triage   { species, packId? }
 * POST /consult  { species, symptoms?, photoDescription?, imageUrl?, packId?, sessionId?, state?, notes? }
 * GET  /session/:sessionId
 * POST /vision   { imageUrl, species?, context? }
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const clinic = require('../services/legacy/farmerSupportClinicService');

const router = express.Router();

router.get('/capabilities', authMiddleware, (req, res) => {
  try {
    res.set('Cache-Control', 'private, max-age=60');
    res.json({ success: true, data: clinic.getCapabilities() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/triage', authMiddleware, (req, res) => {
  try {
    const data = clinic.buildTriagePackage(
      req.body.species || req.body.domain,
      req.body.packId || null,
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message, code: 'TRIAGE_FAILED' });
  }
});

router.post('/consult', authMiddleware, async (req, res) => {
  try {
    const data = await clinic.runAdvisoryConsult({
      speciesKey: req.body.species || req.body.domain,
      symptoms: req.body.symptoms,
      photoDescription: req.body.photoDescription,
      imageUrl: req.body.imageUrl,
      locationState: req.body.state,
      notes: req.body.notes,
      packId: req.body.packId || null,
      sessionId: req.body.sessionId || null,
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message, code: 'CONSULT_FAILED' });
  }
});

router.get('/session/:sessionId', authMiddleware, (req, res) => {
  try {
    const data = clinic.getSessionHistory(req.params.sessionId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vision', authMiddleware, async (req, res) => {
  try {
    const data = await clinic.analyzeImageWithVision({
      imageUrl: req.body.imageUrl,
      speciesKey: req.body.species,
      context: req.body.context,
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message, code: 'VISION_FAILED' });
  }
});

module.exports = router;
