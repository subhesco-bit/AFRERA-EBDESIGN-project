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
const pestEng = require('../modules/agro/PestManagementEngine');
const irrigationEng = require('../modules/agro/IrrigationEngine');
const fertilizerEng = require('../modules/agro/FertilizerEngine');
const yieldEng = require('../modules/agro/YieldPredictionEngine');
const insuranceEng = require('../modules/agro/CropInsuranceEngine');
const fisheryEng = require('../modules/agro/FisheryEngine');
const soilConservationEng = require('../modules/agro/SoilConservationEngine');
const { logToUserHistory } = require('../utils/historyLog');
const organicCertLog = require('../modules/M066/service');
const soilHealthLog = require('../modules/M051/service');
const pestManagementLog = require('../modules/M053/service');
const irrigationLog = require('../modules/M054/service');
const fertilizerLog = require('../modules/M055/service');
const yieldPredictionLog = require('../modules/M056/service');
const cropInsuranceLog = require('../modules/M058/service');
const fisheryLog = require('../modules/M064/service');
const soilConservationLog = require('../modules/M087/service');

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

router.post('/enhanced', async (req, res) => {
  try {
    const input = req.body || {};
    const result = agroEnhanced.runAgroEnhanced(input);
    const userId = req.user?.id || input.user_id;

    // /enhanced produces several independent sub-analyses in one call, each
    // with its own history table — log whichever ones actually ran, same
    // shared-helper pattern as M782 (disease analyzer) and the vet panel.
    const historyWrites = {};
    if (result.certification) {
      const { logged, id } = await logToUserHistory(organicCertLog, userId, {
        crop: input.crop,
        scheme: result.certification.scheme || result.certification.decision?.scheme,
        action: result.certification.decision?.action,
        recorded_at: new Date().toISOString(),
      });
      historyWrites.organic_cert = { logged, id };
    }
    const microbiome = result.multi?.lenses?.microbiome_intelligence;
    if (microbiome) {
      const { logged, id } = await logToUserHistory(soilHealthLog, userId, {
        crop: input.crop,
        fertility_index: microbiome.indices?.fertility_index,
        indices: microbiome.indices,
        recorded_at: new Date().toISOString(),
      });
      historyWrites.soil_health = { logged, id };
    }

    // Real pest risk assessment (backed by PestManagementEngine's IPM data,
    // not a generic placeholder) — runs whenever a crop was given, same as
    // the disease/soil lenses above.
    let pest = null;
    let irrigation = null;
    let fertilizer = null;
    let yieldEstimate = null;
    let insurance = null;
    if (input.crop) {
      pest = pestEng.assessPestRisk(input);
      irrigation = irrigationEng.scheduleForCrop(input);
      fertilizer = fertilizerEng.recommendationForCrop(input);
      yieldEstimate = yieldEng.estimateYield(input);
      insurance = insuranceEng.estimatePremium(input);

      const writes = await Promise.all([
        logToUserHistory(pestManagementLog, userId, {
          crop: input.crop, candidate_count: pest.candidate_count,
          top_candidate: pest.candidates[0]?.id || null, matched_signs: pest.candidates[0]?.matched_signs || [],
          recorded_at: new Date().toISOString(),
        }),
        logToUserHistory(irrigationLog, userId, {
          crop: input.crop, water_need_band: irrigation.water_need_band,
          critical_stage: irrigation.critical_stage?.stage || null, recorded_at: new Date().toISOString(),
        }),
        logToUserHistory(fertilizerLog, userId, {
          crop: input.crop, dose_known: fertilizer.dose_known,
          npk_recommendation: fertilizer.npk_recommendation, recorded_at: new Date().toISOString(),
        }),
        logToUserHistory(yieldPredictionLog, userId, {
          crop: input.crop, baseline_yield_t_ha: yieldEstimate.baseline_yield_t_ha,
          estimated_yield_t_ha: yieldEstimate.estimated_yield_t_ha, recorded_at: new Date().toISOString(),
        }),
        logToUserHistory(cropInsuranceLog, userId, {
          crop: input.crop, crop_class: insurance.crop_class,
          estimated_farmer_premium_inr: insurance.estimated_farmer_premium_inr, recorded_at: new Date().toISOString(),
        }),
      ]);
      [historyWrites.pest_management, historyWrites.irrigation, historyWrites.fertilizer,
        historyWrites.yield_prediction, historyWrites.crop_insurance] = writes.map(
        ({ logged, id }) => ({ logged, id }),
      );
    }

    // Fishery/pond planning is a separate production system, not triggered
    // by `crop` — triggered by pond/area input instead.
    let fishery = null;
    if (input.pond || input.area_hectare) {
      fishery = fisheryEng.pondPlan(input);
      const { logged, id } = await logToUserHistory(fisheryLog, userId, {
        area_hectare: input.area_hectare, intensity: fishery.intensity, recorded_at: new Date().toISOString(),
      });
      historyWrites.fishery = { logged, id };
    }

    // Soil conservation is triggered by slope input, independent of crop.
    let soilConservation = null;
    if (input.slope_pct != null) {
      soilConservation = soilConservationEng.conservationPlan(input);
      const { logged, id } = await logToUserHistory(soilConservationLog, userId, {
        slope_pct: input.slope_pct, slope_band: soilConservation.slope_band?.band || null,
        recorded_at: new Date().toISOString(),
      });
      historyWrites.soil_conservation = { logged, id };
    }

    res.json({
      success: true,
      data: { ...result, pest, irrigation, fertilizer, yield_estimate: yieldEstimate, insurance, fishery, soil_conservation: soilConservation, history_writes: historyWrites },
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

/** Real IPM pest catalogue for a crop — organic/biological/cultural/chemical, in that priority order */
router.get('/pests/:cropId', (req, res) => {
  res.json({ success: true, data: pestEng.pestsForCrop(req.params.cropId) });
});

/** Real crop-stage irrigation schedule */
router.get('/irrigation/:cropId', (req, res) => {
  res.json({ success: true, data: irrigationEng.scheduleForCrop({ crop: req.params.cropId }) });
});

/** Real per-crop NPK fertilizer dose */
router.get('/fertilizer/:cropId', (req, res) => {
  res.json({ success: true, data: fertilizerEng.recommendationForCrop({ crop: req.params.cropId, farming_mode: req.query.mode }) });
});

/** Baseline + adjusted yield estimate */
router.post('/yield-estimate', (req, res) => {
  res.json({ success: true, data: yieldEng.estimateYield(req.body || {}) });
});

/** Real PMFBY crop-insurance premium band */
router.get('/insurance/:cropId', (req, res) => {
  res.json({ success: true, data: insuranceEng.estimatePremium({ crop: req.params.cropId, sum_insured_inr: req.query.sum_insured_inr }) });
});

/** Real carp-polyculture pond plan */
router.post('/fishery/pond-plan', (req, res) => {
  res.json({ success: true, data: fisheryEng.pondPlan(req.body || {}) });
});

/** Real slope-based soil & water conservation plan */
router.post('/soil-conservation', (req, res) => {
  res.json({ success: true, data: soilConservationEng.conservationPlan(req.body || {}) });
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
