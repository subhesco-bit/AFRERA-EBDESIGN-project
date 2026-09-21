'use strict';

/**
 * Farmer Support Clinic — /api/v1/farmer-support-clinic
 * Integrates animal health records on consult when species maps to livestock.
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const clinic = require('../services/legacy/farmerSupportClinicService');
const healthBridge = require('../services/legacy/clinicAnimalHealthBridge');

const router = express.Router();

router.get('/capabilities', authMiddleware, (req, res) => {
  try {
    res.set('Cache-Control', 'private, max-age=60');
    const data = clinic.getCapabilities();
    data.animalHealthBridge = {
      mappedSpecies: Object.keys(healthBridge.SPECIES_TO_ANIMAL_TYPE).filter(
        (k) => healthBridge.SPECIES_TO_ANIMAL_TYPE[k],
      ),
      note: 'Consult loads listExaminations / listOutbreaks / listQuarantines when mapped',
    };
    res.json({ success: true, data });
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
    const speciesKey = req.body.species || req.body.domain;

    // Option 2: load real animal health context in parallel with consult prep
    const healthContext = await healthBridge.loadHealthContext(speciesKey, { limit: 8 });

    const notesWithHealth = [
      req.body.notes,
      healthContext.applicable && healthContext.summaryText
        ? `RECORDED ANIMAL HEALTH (from DB, not invented):\n${healthContext.summaryText}`
        : null,
    ].filter(Boolean).join('\n\n');

    const data = await clinic.runAdvisoryConsult({
      speciesKey,
      symptoms: req.body.symptoms,
      photoDescription: req.body.photoDescription,
      imageUrl: req.body.imageUrl,
      locationState: req.body.state,
      notes: notesWithHealth || req.body.notes,
      packId: req.body.packId || null,
      sessionId: req.body.sessionId || null,
    });

    data.healthContext = {
      applicable: healthContext.applicable,
      animalType: healthContext.animalType,
      examinationCount: (healthContext.examinations || []).length,
      outbreakCount: (healthContext.outbreaks || []).length,
      quarantineCount: (healthContext.quarantines || []).length,
      examinations: healthContext.examinations,
      outbreaks: healthContext.outbreaks,
      quarantines: healthContext.quarantines,
      recordLinks: healthContext.recordLinks,
      summaryText: healthContext.summaryText,
    };
    data.provenance = {
      ...(data.provenance || {}),
      ...(healthContext.provenance || {}),
    };

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

router.get('/health-context/:species', authMiddleware, async (req, res) => {
  try {
    const data = await healthBridge.loadHealthContext(req.params.species, { limit: 10 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
