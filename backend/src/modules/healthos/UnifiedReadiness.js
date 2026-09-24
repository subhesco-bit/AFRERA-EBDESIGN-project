/**
 * Unified Health OS readiness — Animals + Human + Agro status surface
 */

function probe(name, fn) {
  try {
    const v = fn();
    return { module: name, ok: true, detail: v };
  } catch (e) {
    return { module: name, ok: false, error: e.message };
  }
}

function getReadiness() {
  const veterinary = probe('veterinary', () => {
    const vet = require('../veterinary');
    return {
      species: vet.SUPPORTED_SPECIES,
      features: ['panel', 'herd_v2', 'one_health', 'geo_ancestral', 'ethnovet'],
      knowledge: vet.knowledge.KNOWLEDGE_VERSION,
    };
  });

  // Attempt sheep if panel supports later
  const nutrition = probe('rituraj_nutrition', () => {
    const n = require('../nutrition');
    return {
      features: [
        'calculator',
        'ritu',
        'chef',
        'superfoods',
        'religious_genz',
        'medical_branches',
        'allergy_drug_food',
      ],
      ritus: (n.RITUS || []).length,
    };
  });

  const agro = probe('agro_knowledge', () => {
    const a = require('../agro');
    return {
      season: a.currentSeason().id,
      regions: (a.REGIONAL_SYSTEMS || []).length,
    };
  });

  const allOk = [veterinary, nutrition, agro].every((x) => x.ok);

  return {
    platform: 'AFRERA Health OS',
    ready: allOk,
    tier: 'grok-highest',
    pillars: {
      animals_birds_poultry: veterinary,
      human_nutrition_medical: nutrition,
      agro_knowledge: agro,
    },
    one_health_bridge: {
      note: 'Zoonoses and farm-family nutrition share escalation ethics — vet notifiable + human medical branches',
      human_api: '/api/v1/rituraj-nutrition',
      animal_api: '/api/v1/veterinary-specialist',
      agro_api: '/api/v1/agro-knowledge',
    },
    gaps_remaining: [
      'Label-complete veterinary withdrawal DB',
      'LIS/lab imaging hooks',
      'Outcome calibration of panel confidence',
      'Pediatric-specific BMR equations',
      'Official religious calendar date engine (tithi API)',
    ],
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { getReadiness };
