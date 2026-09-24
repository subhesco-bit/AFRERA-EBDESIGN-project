/**
 * Rituraj Nutrition routes — auto-mounted at /api/v1/rituraj-nutrition
 */

const express = require('express');
const nutri = require('../modules/nutrition');

let NUTRITION_WELLNESS_DISCLAIMER =
  'Wellness and nutrition guidance is educational decision-support only.';
try {
  ({ NUTRITION_WELLNESS_DISCLAIMER } = require('../utils/disclaimers'));
} catch (_) {}

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'rituraj-nutrition',
    tier: 'grok-highest',
    features: [
      'calculator_mifflin',
      'macros_micros',
      'ritu_seasonal',
      'natural_therapy',
      'master_chef_plate',
      'geo_local_foods',
      'multi_seat_conference',
    ],
    benchmark: 'veterinary_panel_equivalent_or_higher',
  });
});

router.get('/ritus', (_req, res) => {
  res.json({ success: true, data: nutri.RITUS, current: nutri.currentRitu() });
});

router.get('/natural-therapies', (_req, res) => {
  res.json({
    success: true,
    data: nutri.NATURAL_THERAPIES,
    disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
  });
});

router.get('/geo-regions', (_req, res) => {
  res.json({ success: true, data: nutri.GEO_FOODS });
});

/** Pure calculator */
router.post('/calculate', (req, res) => {
  try {
    const data = nutri.calculateNutrition(req.body?.profile || req.body || {});
    res.json({ success: true, data, disclaimer: NUTRITION_WELLNESS_DISCLAIMER });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: NUTRITION_WELLNESS_DISCLAIMER });
  }
});

/** Full multi-seat conference */
router.post('/conference', (req, res) => {
  try {
    const data = nutri.runNutritionConference(req.body || {});
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: NUTRITION_WELLNESS_DISCLAIMER });
  }
});

/** Chef plate only (requires calculator fields or nested profile) */
router.post('/chef-plate', (req, res) => {
  try {
    const profile = req.body?.profile || req.body || {};
    const calc = nutri.calculateNutrition(profile);
    const ritu = nutri.currentRitu();
    const geo = nutri.matchGeoFoods(req.body?.location || profile.location || {});
    const plate = nutri.masterChefPlate({
      calories: calc.target_calories,
      macros: calc.macros,
      ritu,
      geo,
      cuisine_pref: profile.cuisine_pref,
    });
    res.json({ success: true, data: { calculator: calc, plate }, disclaimer: NUTRITION_WELLNESS_DISCLAIMER });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
