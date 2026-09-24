/**
 * Unified Intelligence OS — cross-module operate for Vet + Nutrition + Agro
 * Closes the farm–family–food continuum gap across the three pillars.
 */

const { randomUUID } = require('crypto');

function tryRequire(p) {
  try {
    return require(p);
  } catch {
    return null;
  }
}

const GAP_REGISTRY = {
  closed_this_release: [
    'unified_cross_module_operate',
    'outcome_feedback_schema',
    'lab_ingest_contracts',
    'life_stage_nutrition',
    'vet_vision_symptom_bridge',
    'gap_registry_api',
  ],
  remaining_product: [
    'live_weather_mandi_apeda_directory',
    'native_cv_model_hosting',
    'telehealth_erx_rails',
    'full_ifct_withdrawal_gazette_db',
    'outcome_calibrated_confidence',
  ],
  modules: {
    veterinary: {
      strengths: ['panel', 'herd', 'one_health', 'pcicda', 'pharmacy', 'schedules', 'pets'],
      gaps_before: ['vision', 'outcome_loop', 'lab_dto'],
    },
    nutrition: {
      strengths: ['calculator', 'ritu', 'culture', 'allergy', 'asian_bmi', 'pharmacy_link'],
      gaps_before: ['life_stage_depth', 'lab_dto', 'outcome_loop'],
    },
    agro: {
      strengths: ['systems', 'crops', 'organic_cert', 'microbiome', 'biochar', 'vision'],
      gaps_before: ['cross_link_nutrition_vet', 'outcome_loop'],
    },
  },
};

/** Structured lab ingest contracts */
const LAB_CONTRACTS = {
  veterinary: {
    fields: ['species', 'sample_type', 'tests[]', 'values{}', 'units{}', 'ref_ranges{}', 'collected_at'],
    example_tests: ['cbc', 'chemistry', 'fecal', 'milk_scc', 'culture'],
  },
  nutrition_human: {
    fields: ['panel_name', 'values{}', 'units{}', 'ref_ranges{}', 'fasting', 'collected_at'],
    example_panels: ['lipid', 'hba1c', 'tsh', 'cbc', 'vitamin_d', 'iron_studies'],
  },
  soil_agro: {
    fields: ['ph', 'oc_pct', 'n', 'p', 'k', 'zn', 'ec', 'texture', 'lab_microbiome{}', 'collected_at'],
  },
};

function recordOutcome(input = {}) {
  return {
    outcome_id: randomUUID(),
    module: input.module || 'unknown',
    case_id_ref: input.case_id || null,
    status: input.status || 'recorded', // improved | worsened | resolved | referred | died | harvested
    notes: input.notes || null,
    metrics: input.metrics || {},
    recorded_at: new Date().toISOString(),
    learning_hook:
      'Store in outcomes table; future confidence calibration job consumes this schema',
  };
}

function lifeStageNutritionFlags(profile = {}) {
  const age = Number(profile.age_years);
  const flags = [];
  if (profile.pregnant || profile.pregnancy) {
    flags.push({
      stage: 'pregnancy',
      priority: 'high',
      notes: ['Folic acid/iron per clinician', 'Avoid alcohol', 'Listeria food safety', 'No self-medication Schedule H'],
    });
  }
  if (profile.lactating) {
    flags.push({
      stage: 'lactation',
      priority: 'high',
      notes: ['Extra energy/protein/fluids', 'Medication lactation safety with clinician'],
    });
  }
  if (age > 0 && age < 18) {
    flags.push({
      stage: 'pediatric',
      priority: 'high',
      notes: ['Growth-appropriate calories', 'No adult weight-loss diets', 'Pediatrician for chronic disease diets'],
    });
  }
  if (age >= 65) {
    flags.push({
      stage: 'geriatric',
      priority: 'moderate',
      notes: ['Protein and micronutrient density', 'Swallow/dentition', 'Polypharmacy food-drug checks'],
    });
  }
  return flags;
}

function vetVisionBridge(input = {}) {
  const tags = (input.cv_tags || []).map((t) => String(t).toLowerCase());
  const text = String(input.description || input.owner_observations || '').toLowerCase();
  const symptoms = [];
  const map = [
    [['lameness', 'limp'], 'lameness'],
    [['discharge', 'nasal'], 'nasal_discharge'],
    [['diarrhea', 'loose stool'], 'diarrhea'],
    [['skin', 'lesion', 'rash'], 'skin_lesion'],
    [['bloat', 'distended'], 'abdominal_distension'],
    [['cough'], 'cough'],
    [['eye', 'ocular'], 'ocular_signs'],
  ];
  for (const [keys, sym] of map) {
    if (keys.some((k) => tags.some((t) => t.includes(k)) || text.includes(k))) symptoms.push(sym);
  }
  return {
    derived_symptoms: symptoms,
    note: 'Vision tags mapped to clinical symptom tokens for panel input — not a diagnosis',
  };
}

/**
 * Unified operate — optional domains: veterinary | nutrition | agro | all
 */
function operateUnified(input = {}) {
  const domains = input.domains || (input.domain === 'all' ? ['veterinary', 'nutrition', 'agro'] : null);
  const out = {
    case_id: randomUUID(),
    engine: 'UnifiedIntelligenceOS',
    engine_tier: 'grok-highest-industry',
    pillars: {},
    continuum: {
      theme: 'Farm family food–soil–animal–human health continuum',
      links: [],
    },
  };

  const wantVet = !domains || domains.includes('veterinary') || input.species;
  const wantNutri = !domains || domains.includes('nutrition') || input.profile || input.weight_kg;
  const wantAgro = !domains || domains.includes('agro') || input.crop || input.farming_system || input.soil;

  if (wantVet) {
    const vet = tryRequire('../veterinary');
    const oh = tryRequire('../onehealth/VeterinaryOneHealthWorkflow');
    let panel = null;
    const visionBridge = input.cv_tags || input.description ? vetVisionBridge(input) : null;
    const clinical = {
      ...(input.clinical || {}),
      symptoms: [
        ...((input.clinical && input.clinical.symptoms) || []),
        ...((visionBridge && visionBridge.derived_symptoms) || []),
      ],
    };
    try {
      if (vet && input.species) {
        const runner = vet.runConferenceWithLocalCare || vet.runConference;
        if (runner) panel = runner({ ...input, clinical });
      }
    } catch (e) {
      panel = { error: e.message };
    }
    let oneHealth = null;
    try {
      if (oh) oneHealth = oh.operate({ ...input, panel_result: panel, clinical });
    } catch (_) {}
    out.pillars.veterinary = { panel, oneHealth, vision_bridge: visionBridge };
    if (panel?.notifiable_suspect) {
      out.continuum.links.push('Animal notifiable signal → PCICDA report path + handler PPE');
    }
    if (panel?.differentials?.some((d) => (d.tags || []).includes('zoonotic_risk'))) {
      out.continuum.links.push('Zoonotic differential → human nutrition/medical caution for farm family');
    }
  }

  if (wantNutri) {
    const nutri = tryRequire('../nutrition');
    const life = lifeStageNutritionFlags(input.profile || input);
    let conference = null;
    try {
      if (nutri?.runNutritionConference) conference = nutri.runNutritionConference(input);
    } catch (e) {
      conference = { error: e.message };
    }
    out.pillars.nutrition = {
      conference,
      life_stage_flags: life,
      lab_contract: LAB_CONTRACTS.nutrition_human,
    };
    if (life.some((l) => l.stage === 'pregnancy')) {
      out.continuum.links.push('Pregnancy nutrition → avoid farm chemical exposure; food safety');
    }
  }

  if (wantAgro) {
    const agro = tryRequire('../agro');
    let multi = null;
    try {
      if (agro?.runAgroMultiAI) multi = agro.runAgroMultiAI(input);
      else if (agro?.runFullAgroIntelligence) multi = agro.runFullAgroIntelligence(input);
    } catch (e) {
      multi = { error: e.message };
    }
    out.pillars.agro = { multi, lab_contract: LAB_CONTRACTS.soil_agro };
    out.continuum.links.push('Soil–crop nutrition quality feeds household diet quality');
  }

  out.lab_contracts = LAB_CONTRACTS;
  out.gap_registry = GAP_REGISTRY;
  out.consensus = {
    continuum_actions: out.continuum.links,
    safety_floor:
      'Licensed vet / physician / pharmacist / dietitian / accredited organic CB / extension remain final authorities',
  };
  out.generatedAt = new Date().toISOString();
  return out;
}

module.exports = {
  operateUnified,
  recordOutcome,
  lifeStageNutritionFlags,
  vetVisionBridge,
  GAP_REGISTRY,
  LAB_CONTRACTS,
};
