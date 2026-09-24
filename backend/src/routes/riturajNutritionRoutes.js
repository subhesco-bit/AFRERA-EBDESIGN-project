/**
 * Rituraj Nutrition + Diet Culture routes — /api/v1/rituraj-nutrition
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
      'india_superfoods',
      'religious_calendars',
      'customary_foodways',
      'genz_diets',
      'medical_diet_branches',
      'multi_seat_conference',
    ],
    benchmark: 'veterinary_panel_equivalent_or_higher',
  });
});

router.get('/ritus', (_req, res) => {
  res.json({ success: true, data: nutri.RITUS, current: nutri.currentRitu() });
});

router.get('/natural-therapies', (_req, res) => {
  res.json({ success: true, data: nutri.NATURAL_THERAPIES, disclaimer: NUTRITION_WELLNESS_DISCLAIMER });
});

router.get('/geo-regions', (_req, res) => {
  res.json({ success: true, data: nutri.GEO_FOODS });
});

router.get('/superfoods', (req, res) => {
  res.json({
    success: true,
    data: nutri.filterSuperfoods({ region: req.query.region, query: req.query.q }),
    disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
  });
});

router.get('/religious-calendars', (req, res) => {
  const t = req.query.tradition || req.query.q || '';
  res.json({
    success: true,
    data: t ? nutri.resolveReligiousCalendar(t) : nutri.resolveReligiousCalendar(''),
    ethics: nutri.ethics,
    disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
  });
});

router.get('/genz-patterns', (_req, res) => {
  const pack = require('../modules/nutrition/knowledge/religious_customary_genz.json');
  res.json({ success: true, data: pack.genz_patterns, disclaimer: NUTRITION_WELLNESS_DISCLAIMER });
});

router.get('/medical-branches', (_req, res) => {
  res.json({
    success: true,
    data: nutri.listMedicalBranches(),
    disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
  });
});

router.post('/calculate', (req, res) => {
  try {
    const data = nutri.calculateNutrition(req.body?.profile || req.body || {});
    res.json({ success: true, data, disclaimer: NUTRITION_WELLNESS_DISCLAIMER });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: NUTRITION_WELLNESS_DISCLAIMER });
  }
});

router.post('/conference', (req, res) => {
  try {
    const data = nutri.runNutritionConference(req.body || {});
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: NUTRITION_WELLNESS_DISCLAIMER });
  }
});

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

router.post('/culture-seat', (req, res) => {
  try {
    res.json({ success: true, data: nutri.buildCultureSeat(req.body || {}), disclaimer: NUTRITION_WELLNESS_DISCLAIMER });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
