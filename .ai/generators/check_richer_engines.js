// Batch check: for each of the 13 core-domain generic-CRUD scaffolds, does a
// richer, already-real implementation exist elsewhere? One pass instead of
// 13 separate lookups.
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');

const candidates = {
  M051_soil_health: ['backend/src/modules/agro/SoilMicrobiomeEngine.js'],
  M052_crop_diseases: ['modules/M782_DISEASE_ANALYZER_AI/backend/service.js'],
  M053_pest_management: ['backend/src/modules/agro/CropIntelligenceEngine.js'],
  M054_irrigation: [],
  M055_fertilizer: [],
  M056_yield_prediction: ['backend/src/modules/agro/CropIntelligenceEngine.js'],
  M058_crop_insurance: [],
  M061_livestock_health: ['backend/src/modules/veterinary'],
  M062_dairy: ['backend/src/modules/veterinary/species/dairy', 'backend/src/modules/veterinary/knowledge/diseases_dairy.json'],
  M063_poultry: ['backend/src/modules/veterinary/species/poultry', 'backend/src/modules/veterinary/knowledge/diseases_poultry.json'],
  M064_fishery: [],
  M066_organic_cert: ['backend/src/modules/agro/OrganicCertificationEngine.js'],
  M087_soil_conservation: ['backend/src/modules/agro/SoilMicrobiomeEngine.js'],
};

const results = {};
for (const [key, paths] of Object.entries(candidates)) {
  const existing = paths.filter((p) => fs.existsSync(path.join(ROOT, p)));
  results[key] = { knownCandidates: existing };
}

// For the ones with no known candidate, search by keyword under backend/src/modules and modules/
const keywordMap = {
  M054_irrigation: 'irrigation',
  M055_fertilizer: 'fertilizer',
  M058_crop_insurance: 'insurance',
  M064_fishery: 'fisher',
};
for (const [key, kw] of Object.entries(keywordMap)) {
  try {
    const out = execSync(
      `grep -rli "${kw}" "${path.join(ROOT, 'backend', 'src', 'modules')}" "${path.join(ROOT, 'modules')}" --include="*.js" 2>/dev/null | grep -vi "node_modules" | head -5`,
      { encoding: 'utf8', shell: 'C:\\Program Files\\Git\\bin\\bash.exe' },
    ).trim();
    results[key].searchHits = out ? out.split('\n').map((f) => f.replace(ROOT + '\\', '').replace(ROOT + '/', '')) : [];
  } catch {
    results[key].searchHits = [];
  }
}

console.log(JSON.stringify(results, null, 2));
