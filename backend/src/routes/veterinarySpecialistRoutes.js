/**
 * Veterinary Specialist Panel + One Health + Geo-ancestral care routes
 * Auto-mounted at /api/v1/veterinary-specialist
 */

const express = require('express');
const vet = require('../modules/veterinary');
const { computeHerdRisk } = require('../modules/veterinary/herd/HerdRiskScoring');
const { assessSurveillance, INTERNATIONAL_STAGES } = require('../modules/veterinary/onehealth/OneHealthSurveillance');
const { buildLocalCarePackage } = require('../modules/veterinary/geo/GeoFencedCare');
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
    features: [
      'panel', 'herd_risk', 'one_health', 'international_stages',
      'vaccination_gaps', 'geo_ancestral_care', 'natural_care', 'dietary_care',
    ],
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
    note: 'Operational mapping inspired by WOAH concepts — not official WOAH codes.',
    disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
  });
});

/** Full conference with geo-local ancestral + natural + dietary care */
router.post('/panel/conference', (req, res) => {
  try {
    const report = vet.runConferenceWithLocalCare(req.body || {});
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
    res.json({ success: true, data: vet.runHerdScreen(req.body || {}) });
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

router.post('/herd/risk-score', (req, res) => {
  try {
    const result = computeHerdRisk(req.body || {});
    res.json({ success: true, data: result, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/one-health/assess', (req, res) => {
  try {
    res.json({ success: true, data: assessSurveillance(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  }
});

/** Geo-fenced ancestral + natural + dietary care only */
router.post('/local-care', (req, res) => {
  try {
    const species = vet.normaliseSpecies(req.body?.species);
    const pack = buildLocalCarePackage({
      species,
      location: req.body?.location || {},
      clinical: req.body?.clinical || {},
      history: req.body?.history || {},
    });
    res.json({ success: true, data: pack });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  }
});

router.get('/local-care/regions', (_req, res) => {
  try {
    const geo = require('../modules/veterinary/knowledge/geo_ethnovet_india.json');
    res.json({
      success: true,
      data: {
        version: geo.version,
        regions: (geo.regions || []).map((r) => ({
          id: r.id,
          states: r.states,
          climate: r.climate,
          ancestral_count: (r.ancestral_practices || []).length,
        })),
        pan_india_count: (geo.pan_india_ancestral || []).length,
      },
      disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
