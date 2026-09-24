/**
 * Veterinary Specialist Panel + One Health routes
 * Discovered by DynamicRouteLoader under backend/src/routes/
 * Also mounted explicitly from index.js for stable contract.
 *
 * Base paths (after mount):
 *   /api/veterinary/*
 *   /api/v1/veterinary/*
 */

const express = require('express');
const vet = require('../modules/veterinary');
const { computeHerdRisk } = require('../modules/veterinary/herd/HerdRiskScoring');
const { assessSurveillance, INTERNATIONAL_STAGES } = require('../modules/veterinary/onehealth/OneHealthSurveillance');
const { VETERINARY_CLINICAL_DISCLAIMER } = require('../utils/disclaimers');
const { logger } = require('../utils/logger');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'veterinary-specialist-panel',
    species: vet.SUPPORTED_SPECIES,
    knowledge_version: vet.knowledge.KNOWLEDGE_VERSION,
    tier: 'grok-highest',
    features: ['panel', 'herd_risk', 'one_health', 'international_stages', 'vaccination_gaps'],
  });
});

router.get('/species', (_req, res) => {
  res.json({
    supported: vet.SUPPORTED_SPECIES,
    norms: vet.NORMS,
    vaccination_calendars: vet.VAX_CALENDARS,
    disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
  });
});

router.get('/diseases/:species', (req, res) => {
  try {
    const diseases = vet.knowledge.listDiseases(req.params.species);
    res.json({
      success: true,
      species: vet.normaliseSpecies(req.params.species),
      count: diseases.length,
      diseases,
      disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  }
});

router.get('/ethnovet/:species', (req, res) => {
  try {
    res.json({
      success: true,
      species: vet.normaliseSpecies(req.params.species),
      remedies: vet.knowledge.getEthnovetForSpecies(req.params.species),
      disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/international-stages', (_req, res) => {
  res.json({
    success: true,
    stages: INTERNATIONAL_STAGES,
    note: 'Operational mapping inspired by WOAH outbreak response concepts — not official WOAH status codes.',
    disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
  });
});

/** Full multi-specialist case conference (+ embedded herd risk + optional surveillance) */
router.post('/panel/conference', (req, res) => {
  try {
    const report = vet.runConference(req.body || {});
    const surveillance = assessSurveillance({
      species: report.species,
      differentials: report.differentials,
      herd_risk: report.herd_risk,
      history: req.body?.history,
      location: req.body?.location,
      context: req.body?.context,
      lab_confirmed: req.body?.lab_confirmed,
      authority_confirmed: req.body?.authority_confirmed,
    });
    res.json({
      success: true,
      data: {
        ...report,
        one_health_surveillance: surveillance,
      },
    });
  } catch (e) {
    logger.error('veterinary panel conference', { error: e.message });
    res.status(400).json({ success: false, error: e.message, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  }
});

router.post('/panel/herd-screen', (req, res) => {
  try {
    const report = vet.runHerdScreen(req.body || {});
    res.json({ success: true, data: report });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  }
});

router.post('/panel/vitals', (req, res) => {
  try {
    const species = vet.normaliseSpecies(req.body?.species);
    const vitals = vet.interpretVitals(species, req.body?.clinical || {});
    res.json({ success: true, data: { species, vitals }, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/panel/vaccination-gaps', (req, res) => {
  try {
    const species = vet.normaliseSpecies(req.body?.species);
    const analysis = vet.vaccinationGapAnalysis(species, req.body || {});
    res.json({ success: true, data: { species, ...analysis }, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

/** Standalone herd risk scoring */
router.post('/herd/risk-score', (req, res) => {
  try {
    const result = computeHerdRisk({
      history: req.body?.history,
      differentials: req.body?.differentials,
      context: req.body?.context,
      production_stage_summary: req.body?.production_stage_summary,
    });
    res.json({ success: true, data: result, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

/** One Health surveillance assessment */
router.post('/one-health/assess', (req, res) => {
  try {
    const result = assessSurveillance(req.body || {});
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  }
});

module.exports = router;
