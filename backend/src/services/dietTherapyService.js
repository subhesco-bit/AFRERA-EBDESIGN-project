'use strict';

const aiBackbone = require('./legacy/aiBackboneService');
const { NUTRITION_WELLNESS_DISCLAIMER } = require('../utils/disclaimers');

const REGIONAL_STAPLES = Object.freeze({
  assam: ['rice', 'lentils', 'leafy greens', 'seasonal vegetables', 'fermented foods'],
  northeast: ['rice', 'millets', 'lentils', 'leafy greens', 'seasonal vegetables'],
  north: ['whole wheat', 'millets', 'lentils', 'seasonal vegetables', 'curd'],
  south: ['rice', 'millets', 'lentils', 'coconut', 'seasonal vegetables'],
  west: ['millets', 'pulses', 'vegetables', 'groundnuts', 'curd'],
  east: ['rice', 'fish or pulses', 'leafy greens', 'seasonal vegetables', 'curd']
});

function validateProfile(profile = {}) {
  const age = Number(profile.age);
  if (!Number.isFinite(age) || age < 1 || age > 120) throw new Error('age must be between 1 and 120');
  if (!['male', 'female', 'other', 'prefer_not_to_say'].includes(profile.sex)) throw new Error('sex is required');
  const region = String(profile.region || 'northeast').toLowerCase();
  const restrictions = Array.isArray(profile.dietary_restrictions) ? profile.dietary_restrictions : [];
  const allergies = Array.isArray(profile.allergies) ? profile.allergies : [];
  return { age, sex: profile.sex, region, restrictions, allergies, goals: profile.goals || [] };
}

function buildBaseline(profile) {
  const staples = REGIONAL_STAPLES[profile.region] || REGIONAL_STAPLES.northeast;
  const excluded = new Set([...profile.restrictions, ...profile.allergies].map(value => String(value).toLowerCase()));
  const safeStaples = staples.filter(item => !excluded.has(item));
  return {
    region: profile.region,
    meal_pattern: ['vegetables or fruit', 'protein source', 'whole-food carbohydrate', 'water'],
    regional_food_groups: safeStaples,
    safety_flags: profile.allergies.length ? ['Review every ingredient and cross-contact risk with a qualified professional.'] : [],
    clinical_status: 'education_only'
  };
}

async function createPlan(profileInput, options = {}) {
  const profile = validateProfile(profileInput);
  const baseline = buildBaseline(profile);
  let ai = { status: 'not_configured', recommendations: [] };
  if (options.useAI !== false) {
    try {
      const prompt = `Provide culturally appropriate nutrition education, not diagnosis or treatment. Return concise JSON with meal_ideas, substitutions, and questions_for_professional. Profile: ${JSON.stringify(profile)} Baseline: ${JSON.stringify(baseline)}`;
      const response = await aiBackbone.callAI(prompt, { provider: options.provider });
      ai = { status: 'generated', recommendations: response };
    } catch (error) {
      ai = { status: 'unavailable', recommendations: [], reason: 'AI provider unavailable' };
    }
  }
  return { profile, baseline, ai, disclaimer: NUTRITION_WELLNESS_DISCLAIMER, provenance: 'regional food-group baseline plus optional configured AI advisory; verify with a registered dietitian' };
}

module.exports = { createPlan, validateProfile, buildBaseline, REGIONAL_STAPLES };
