/**
 * Unified Health OS readiness — three pillars + platform OS
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
      features: ['panel', 'herd', 'one_health', 'pcicda', 'pharmacy', 'vision_bridge'],
    };
  });

  const nutrition = probe('rituraj_nutrition', () => {
    require('../nutrition');
    return {
      features: ['calculator', 'asian_bmi', 'allergy', 'ritu', 'life_stage', 'culture'],
    };
  });

  const agro = probe('agro_knowledge', () => {
    const a = require('../agro');
    return {
      features: ['systems', 'crops', 'organic', 'microbiome', 'biochar', 'vision', 'multi_ai'],
      biochar_methods: a.CHARGING_METHODS?.length,
    };
  });

  const platform = probe('unified_intelligence_os', () => {
    const u = require('../platform/UnifiedIntelligenceOS');
    return { gaps_closed: u.GAP_REGISTRY.closed_this_release.length };
  });

  const allOk = [veterinary, nutrition, agro, platform].every((x) => x.ok);

  return {
    platform: 'AFRERA Unified Intelligence OS',
    ready: allOk,
    blockers: allOk ? [] : [veterinary, nutrition, agro, platform].filter((x) => !x.ok),
    tier: 'grok-highest-industry',
    pillars: {
      veterinary_health: veterinary,
      human_nutrition: nutrition,
      agro_farming: agro,
      unified_os: platform,
    },
    apis: {
      unified: '/api/v1/unified-intelligence',
      veterinary: '/api/v1/veterinary-specialist',
      nutrition: '/api/v1/rituraj-nutrition',
      agro: '/api/v1/agro-farming',
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { getReadiness };
