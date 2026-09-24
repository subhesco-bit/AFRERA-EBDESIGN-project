/**
 * Agro farming — systems, vision, crops, soil, microbiome, APK matrix
 */
const express = require('express');
const farming = require('../modules/agro/FarmingSystemsEngine');
const vision = require('../modules/agro/AgroVisionAnalysis');
const orchestra = require('../modules/agro/AgroIntelligenceOrchestra');
const knowledge = require('../modules/agro/AgroKnowledgeEngine');
const cropIntel = require('../modules/agro/CropIntelligenceEngine');
const soilEng = require('../modules/agro/SoilMicrobiomeEngine');
const apk = require('../modules/agro/ApkFeatureMatrix');

const router = express.Router();

router.get('/health', (_req, res) => {
  const crops = cropIntel.listAllCrops();
  res.json({
    ok: true,
    module: 'agro-farming',
    systems: Object.keys(farming.SYSTEMS),
    crop_categories: Object.keys(crops.categories),
    disease_cards: cropIntel.diseases.diseases.length,
  });
});

router.get('/systems', (_req, res) => {
  res.json({ success: true, data: farming.SYSTEMS, disclaimer: farming.FARM_DISCLAIMER });
});

router.get('/crops', (_req, res) => {
  res.json({ success: true, data: cropIntel.listAllCrops() });
});

router.get('/crops/search', (req, res) => {
  res.json({ success: true, data: cropIntel.searchCrops(req.query.q || '') });
});

router.get('/crops/:id/diseases', (req, res) => {
  res.json({ success: true, data: cropIntel.diseasesForCrop(req.params.id) });
});

router.post('/crops/analyze', (req, res) => {
  try {
    res.json({ success: true, data: cropIntel.runCropDeepAnalysis(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/soil/analyze', (req, res) => {
  try {
    res.json({ success: true, data: soilEng.analyzeSoil(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/apk-features', (_req, res) => {
  res.json({ success: true, data: apk.getMatrix() });
});

router.post('/systems/conference', (req, res) => {
  try {
    res.json({ success: true, data: farming.runFarmingSystemConference(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/climate/advise', (req, res) => {
  try {
    const systemId = farming.normalizeSystem(req.body?.system);
    res.json({ success: true, data: farming.climateAdvice(systemId, req.body?.telemetry || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/vision/analyze', (req, res) => {
  try {
    res.json({ success: true, data: vision.analyzeVision(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/intelligence', (req, res) => {
  try {
    const base = orchestra.runFullAgroIntelligence(req.body || {});
    const deep = cropIntel.runCropDeepAnalysis(req.body || {});
    res.json({
      success: true,
      data: { ...base, crop_deep: deep, apk_parity: apk.getMatrix() },
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/knowledge/conference', (req, res) => {
  try {
    res.json({ success: true, data: knowledge.runAgroConference(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
