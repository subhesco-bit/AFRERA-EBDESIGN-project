const express = require('express');
const farming = require('../modules/agro/FarmingSystemsEngine');
const vision = require('../modules/agro/AgroVisionAnalysis');
const orchestra = require('../modules/agro/AgroIntelligenceOrchestra');
const knowledge = require('../modules/agro/AgroKnowledgeEngine');
const cropIntel = require('../modules/agro/CropIntelligenceEngine');
const soilEng = require('../modules/agro/SoilMicrobiomeEngine');
const apk = require('../modules/agro/ApkFeatureMatrix');
const cert = require('../modules/agro/OrganicCertificationEngine');
const micro = require('../modules/agro/DeepMicrobiomeAI');
const multi = require('../modules/agro/AgroMultiAIOrchestra');
const gaps = require('../modules/agro/AgroGapAnalysisInternational');
const biochar = require('../modules/agro/BiocharEngine');
const agroEnhanced = require('../modules/agro/AgroEnhancedOperate');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'agro-farming',
    systems: Object.keys(farming.SYSTEMS || {}),
    organic_schemes: Object.keys(cert.SCHEMES || {}),
    microbiome_guilds: (micro.FUNCTIONAL_GUILDS || []).length,
    biochar_charging_methods: (biochar.CHARGING_METHODS || []).length,
    enhanced: true,
  });
});

router.post('/enhanced', (req, res) => {
  try {
    res.json({ success: true, data: agroEnhanced.runAgroEnhanced(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/systems', (_req, res) => {
  res.json({ success: true, data: farming.SYSTEMS });
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

router.post('/microbiome/interpret', (req, res) => {
  try {
    res.json({ success: true, data: micro.interpretMicrobiome(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/organic/schemes', (_req, res) => {
  res.json({ success: true, data: cert.SCHEMES, disclaimer: cert.CERT_DISCLAIMER });
});

router.post('/organic/certification', (req, res) => {
  try {
    res.json({ success: true, data: cert.runCertificationConference(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/biochar/methods', (_req, res) => {
  res.json({
    success: true,
    data: {
      charging_methods: biochar.CHARGING_METHODS,
      benefits: biochar.BENEFITS,
      india_feedstocks: biochar.INDIA_FEEDSTOCKS,
    },
    disclaimer: biochar.BIOCHAR_DISCLAIMER,
  });
});

router.post('/biochar/conference', (req, res) => {
  try {
    res.json({ success: true, data: biochar.runBiocharConference(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/biochar/charging/recommend', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        recommendation: biochar.recommendCharging(req.body || {}),
        suitability: biochar.assessSuitability(req.body || {}),
      },
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/gaps/international', (_req, res) => {
  res.json({ success: true, data: gaps.getGapReport() });
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
    res.json({
      success: true,
      data: farming.climateAdvice(farming.normalizeSystem(req.body?.system), req.body?.telemetry || {}),
    });
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
    res.json({ success: true, data: orchestra.runFullAgroIntelligence(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/multi-ai/analyze', (req, res) => {
  try {
    res.json({ success: true, data: multi.runAgroMultiAI(req.body || {}) });
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
