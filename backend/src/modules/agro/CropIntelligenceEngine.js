/**
 * Crop Intelligence — catalogue search, season-water-soil, disease organic/inorganic
 */

const { randomUUID } = require('crypto');
const catalogue = require('./knowledge/india_crops_catalogue.json');
const diseases = require('./knowledge/crop_diseases_india.json');
const soilEng = require('./SoilMicrobiomeEngine');
const farming = require('./FarmingSystemsEngine');
const vision = require('./AgroVisionAnalysis');
const knowledge = require('./AgroKnowledgeEngine');

function listAllCrops() {
  return {
    categories: catalogue.categories,
    profiles: catalogue.crop_profiles,
    version: catalogue.version,
  };
}

function searchCrops(query = '') {
  const q = String(query).toLowerCase();
  const fromCat = [];
  for (const [cat, items] of Object.entries(catalogue.categories)) {
    for (const id of items) {
      if (!q || id.includes(q) || cat.includes(q)) fromCat.push({ id, category: cat });
    }
  }
  const profiles = catalogue.crop_profiles.filter(
    (p) => !q || p.id.includes(q) || (p.regions || []).some((r) => r.includes(q)),
  );
  return { query: q, matches: fromCat.slice(0, 50), profiles };
}

function diseasesForCrop(cropId) {
  const c = String(cropId || '').toLowerCase();
  return (diseases.diseases || []).filter(
    (d) => (d.crop || []).includes(c) || (d.crop || []).includes('*') || c.includes(String(d.crop?.[0] || '')),
  );
}

function runCropDeepAnalysis(input = {}) {
  const crop = String(input.crop || input.crop_focus || '').toLowerCase();
  const profile =
    catalogue.crop_profiles.find((p) => p.id === crop || crop.includes(p.id)) ||
    null;
  const season = knowledge.currentSeason(input.as_of ? new Date(input.as_of) : new Date());
  const soil = soilEng.analyzeSoil(input);
  const dis = crop ? diseasesForCrop(crop) : [];
  const system = farming.runFarmingSystemConference(input);
  const vis =
    input.cv_tags || input.description || input.model_predictions
      ? vision.analyzeVision(input)
      : null;

  const seasonFit =
    profile && profile.seasons
      ? profile.seasons.some((s) => s.includes(season.id) || s.includes('multi') || s.includes('perennial') || s.includes('year'))
      : null;

  return {
    case_id: randomUUID(),
    engine: 'CropIntelligenceEngine',
    engine_tier: 'grok-highest',
    crop: crop || null,
    profile,
    season,
    season_fit: seasonFit,
    water_need: profile?.water || input.water || null,
    soil_preference: profile?.soil || null,
    soil_analysis: soil,
    diseases: dis.map((d) => ({
      id: d.id,
      name: d.name,
      signs: d.signs,
      severity: d.severity,
      cure_organic: d.organic,
      cure_inorganic: d.inorganic,
    })),
    farming_system: system,
    vision: vis,
    panel_summary: [
      crop ? `Crop ${crop}` : 'No crop specified',
      `Season ${season.id} fit=${seasonFit}`,
      `${dis.length} disease cards`,
      soil.nutrition_path.mode + ' nutrition path',
      vis ? `Vision ${vis.severity}` : null,
    ].filter(Boolean).join(' | '),
    disclaimer: soilEng.SOIL_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  listAllCrops,
  searchCrops,
  diseasesForCrop,
  runCropDeepAnalysis,
  catalogue,
  diseases,
};
