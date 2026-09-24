/**
 * Unified Health OS readiness — Animals + Pets + Human + Agro + MultiAI
 */

function probe(name, fn) {
  try {
    return { module: name, ok: true, detail: fn() };
  } catch (e) {
    return { module: name, ok: false, error: e.message };
  }
}

function getReadiness() {
  const veterinary = probe('veterinary', () => {
    const vet = require('../veterinary');
    return {
      species: vet.SUPPORTED_SPECIES || require('../veterinary/knowledge').SUPPORTED_SPECIES,
      features: ['panel', 'herd_v2', 'one_health', 'geo_ancestral', 'pets_duck_rabbit_dog_cat_fish'],
    };
  });

  const nutrition = probe('rituraj_nutrition', () => {
    const n = require('../nutrition');
    return {
      features: ['calculator', 'asian_bmi', 'allergy_drug_food', 'ritu', 'superfoods', 'genz', 'medical_branches'],
    };
  });

  const agro = probe('agro_knowledge', () => {
    const a = require('../agro');
    return { season: a.currentSeason().id, regions: a.REGIONAL_SYSTEMS.length };
  });

  const multiAi = probe('multi_ai_orchestra', () => {
    const m = require('./MultiAIOrchestra');
    return { modes: m.AI_MODES.map((x) => x.id) };
  });

  const allOk = [veterinary, nutrition, agro, multiAi].every((x) => x.ok);

  return {
    platform: 'AFRERA Health OS',
    ready: allOk,
    blockers: allOk ? [] : [veterinary, nutrition, agro, multiAi].filter((x) => !x.ok),
    tier: 'grok-highest',
    pillars: {
      animals_birds_poultry_pets: veterinary,
      human_nutrition_medical: nutrition,
      agro_knowledge: agro,
      multi_ai_decision_analysis: multiAi,
    },
    apis: {
      veterinary: '/api/v1/veterinary-specialist',
      nutrition: '/api/v1/rituraj-nutrition',
      agro: '/api/v1/agro-knowledge',
      multi_ai: '/api/v1/multi-ai-health',
      readiness: '/api/v1/health-os/readiness',
    },
    species_full: [
      'cow', 'pig', 'goat', 'sheep', 'poultry', 'duck',
      'rabbit', 'dog', 'cat', 'fish',
    ],
    ai_modes: [
      'clinical_decision',
      'scientific_research',
      'generative_nextgen',
      'ancient_wisdom',
      'systems_analytics',
      'one_health',
    ],
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { getReadiness };
