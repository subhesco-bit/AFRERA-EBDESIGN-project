/**
 * Multi-AI Orchestra — decision-making & analysis modes for AFRERA Health OS
 *
 * Modes (not separate LLM vendors — orchestrated analysis lenses):
 *  - generative_nextgen: structured creative options + scenarios
 *  - scientific_research: evidence grades, differentials, method transparency
 *  - clinical_decision: urgency, escalation, safety gates
 *  - ancient_wisdom: Ritu / ancestral / ethnovet complementary (never overrides clinical)
 *  - systems_analytics: scores, trends, herd/risk metrics
 *  - one_health: human–animal–environment bridge
 *
 * This is deterministic orchestration + knowledge engines. Wire external LLMs
 * at the gateway layer if desired; core decisions remain rule+knowledge grounded.
 */

const { randomUUID } = require('crypto');

const AI_MODES = [
  {
    id: 'clinical_decision',
    name: 'Clinical Decision AI',
    era: 'modern_clinical',
    role: 'Urgency, isolation, notifiable gates, escalation paths',
  },
  {
    id: 'scientific_research',
    name: 'Scientific Research AI',
    era: 'evidence_based',
    role: 'Differentials, evidence grades, lab recommendations, method notes',
  },
  {
    id: 'generative_nextgen',
    name: 'Next-Gen Generative AI',
    era: 'generative',
    role: 'Scenario branches, plain-language summaries, care plan drafts',
  },
  {
    id: 'ancient_wisdom',
    name: 'Ancient / Traditional Wisdom AI',
    era: 'classical_traditional',
    role: 'Ritu, ancestral ethnovet, customary diets — complementary only',
  },
  {
    id: 'systems_analytics',
    name: 'Systems Analytics AI',
    era: 'quantitative',
    role: 'Herd risk, BMI dual, attack rates, vaccination gaps',
  },
  {
    id: 'one_health',
    name: 'One Health AI',
    era: 'planetary_health',
    role: 'Zoonoses, farm-family, environment, WOAH-style stages',
  },
];

function tryRequire(path) {
  try {
    return require(path);
  } catch {
    return null;
  }
}

/**
 * Run multi-AI analysis on a unified health query.
 * domain: 'veterinary' | 'nutrition' | 'agro' | 'auto'
 */
function runMultiAIAnalysis(input = {}) {
  const domain = String(input.domain || 'auto').toLowerCase();
  const modesRequested = input.modes || AI_MODES.map((m) => m.id);
  const case_id = randomUUID();
  const lenses = {};
  let primary = null;
  let domainResolved = domain;

  // Auto domain detection
  if (domain === 'auto') {
    if (input.species || input.clinical?.symptoms) domainResolved = 'veterinary';
    else if (input.profile || input.weight_kg || input.goal) domainResolved = 'nutrition';
    else if (input.crop_focus || input.soil) domainResolved = 'agro';
    else domainResolved = 'nutrition';
  }

  if (domainResolved === 'veterinary') {
    const vet = tryRequire('../veterinary');
    if (vet?.runConferenceWithLocalCare || vet?.runConference) {
      const runner = vet.runConferenceWithLocalCare || vet.runConference;
      primary = runner(input);
    }
  } else if (domainResolved === 'nutrition') {
    const nutri = tryRequire('../nutrition');
    if (nutri?.runNutritionConference) {
      primary = nutri.runNutritionConference(input);
    }
  } else if (domainResolved === 'agro') {
    const agro = tryRequire('../agro');
    if (agro?.runAgroConference) {
      primary = agro.runAgroConference(input);
    }
  }

  // Lens projections from primary payload
  if (modesRequested.includes('clinical_decision')) {
    lenses.clinical_decision = {
      mode: 'clinical_decision',
      urgency: primary?.urgency || primary?.clinical_flags?.[0]?.severity || 'routine',
      isolation_recommended: primary?.isolation_recommended ?? null,
      notifiable_suspect: primary?.notifiable_suspect ?? null,
      clinical_flags: primary?.clinical_flags || primary?.allergy_drug_safety?.drug_food_flags || [],
      decision:
        primary?.notifiable_suspect || primary?.urgency === 'emergency'
          ? 'ESCALATE_LICENSED_PROFESSIONAL_NOW'
          : primary?.urgency === 'urgent'
            ? 'SEEK_CARE_SOON'
            : 'SUPPORTIVE_MONITOR_WITH_PROFESSIONAL_BACKUP',
      rationale: primary?.panel_summary || 'Insufficient primary engine output',
    };
  }

  if (modesRequested.includes('scientific_research')) {
    lenses.scientific_research = {
      mode: 'scientific_research',
      differentials: primary?.differentials || null,
      evidence_items: primary?.treatment_options || primary?.natural_therapies || null,
      diagnostics: primary?.recommended_diagnostics || null,
      methodology: primary?.provenance || primary?.calculator?.methodology || null,
      confidence_overall: primary?.confidence_overall ?? null,
    };
  }

  if (modesRequested.includes('generative_nextgen')) {
    lenses.generative_nextgen = {
      mode: 'generative_nextgen',
      plain_summary: primary?.panel_summary || 'No summary',
      care_plan_draft: {
        immediate: primary?.preventive_actions?.slice?.(0, 3) || primary?.master_chef_plan?.meals?.[0] || null,
        short_term: primary?.treatment_options?.filter?.((t) => t.modality === 'supportive') || null,
        lifestyle_or_herd: primary?.herd_implications || primary?.dietary_care || null,
      },
      scenarios: [
        { id: 'best_case', note: 'Early professional confirmation; supportive measures; monitoring' },
        { id: 'caution_case', note: 'Worsening signs → escalate urgency; do not rely on traditional-only' },
        { id: 'worst_case_notifiable', note: 'If notifiable/zoonotic confirmed → official pathways only' },
      ],
    };
  }

  if (modesRequested.includes('ancient_wisdom')) {
    lenses.ancient_wisdom = {
      mode: 'ancient_wisdom',
      policy: 'Complementary only — never replaces emergency or notifiable pathways',
      ritu: primary?.ritu || null,
      ancestral: primary?.ancestral_therapies || primary?.local_care?.ancestral_customary_medicine || null,
      ethnovet: primary?.local_customary_notes || primary?.natural_therapies || null,
      traditional_agro: primary?.traditional_practices || null,
    };
  }

  if (modesRequested.includes('systems_analytics')) {
    lenses.systems_analytics = {
      mode: 'systems_analytics',
      herd_risk: primary?.herd_risk || null,
      calculator: primary?.calculator || null,
      bmi_dual: primary?.calculator?.bmi_dual || primary?.allergy_drug_safety?.bmi_dual || null,
      vaccination_analysis: primary?.vaccination_analysis || null,
      season: primary?.season || primary?.ritu || null,
    };
  }

  if (modesRequested.includes('one_health')) {
    lenses.one_health = {
      mode: 'one_health',
      note: primary?.one_health_note || null,
      surveillance: primary?.one_health_surveillance || null,
      zoonotic_signals:
        primary?.differentials?.filter?.((d) => (d.tags || []).includes('zoonotic_risk')) || [],
      farm_family_nutrition_bridge:
        domainResolved === 'veterinary'
          ? 'Consider handler PPE and household water separation; optional human nutrition conference for farm family'
          : null,
    };
  }

  // Consensus decision
  const clinical = lenses.clinical_decision;
  const consensus = {
    action: clinical?.decision || 'REVIEW_WITH_PROFESSIONAL',
    domain: domainResolved,
    modes_fired: Object.keys(lenses),
    safety_floor: 'Licensed veterinarian / physician / dietitian remains final authority for diagnosis and prescription',
  };

  return {
    case_id,
    orchestra: 'MultiAIOrchestra',
    engine_tier: 'grok-highest',
    ai_modes_catalogue: AI_MODES,
    domain: domainResolved,
    primary_engine_result: primary,
    lenses,
    consensus,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  runMultiAIAnalysis,
  AI_MODES,
};
