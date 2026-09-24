/**
 * Multi-AI Orchestra — industry-grade non-generic medical intelligence
 * Integrates veterinary, nutrition, agro, pharmacy, protocols, analytics.
 */

const { randomUUID } = require('crypto');

const AI_MODES = [
  { id: 'clinical_decision', name: 'Clinical Decision AI', era: 'modern_clinical', role: 'Urgency, escalation, safety gates' },
  { id: 'scientific_research', name: 'Scientific Research AI', era: 'evidence_based', role: 'Differentials, evidence, labs' },
  { id: 'generative_nextgen', name: 'Next-Gen Generative AI', era: 'generative', role: 'Scenarios, care plans, plain language' },
  { id: 'ancient_wisdom', name: 'Ancient / Traditional Wisdom AI', era: 'classical_traditional', role: 'Ritu, ethnovet, ancestral — complementary only' },
  { id: 'systems_analytics', name: 'Systems Analytics AI', era: 'quantitative', role: 'Composite risk, protocol coverage, KPIs' },
  { id: 'one_health', name: 'One Health AI', era: 'planetary_health', role: 'Zoonoses + full protocol families' },
  { id: 'pharmacy_intelligence', name: 'Pharmacy Intelligence AI', era: 'clinical_pharmacy', role: 'Classes, interactions, stewardship, Schedule awareness' },
  { id: 'protocol_engine', name: 'Protocol Engine AI', era: 'clinical_operations', role: 'Emergency, AMS, metabolic, maternal, pediatric, biosecurity' },
];

function tryRequire(path) {
  try { return require(path); } catch { return null; }
}

function runMultiAIAnalysis(input = {}) {
  const domain = String(input.domain || 'auto').toLowerCase();
  const modesRequested = input.modes || AI_MODES.map((m) => m.id);
  const case_id = randomUUID();
  const lenses = {};
  let primary = null;
  let domainResolved = domain;

  if (domain === 'auto') {
    if (input.species || input.clinical?.symptoms) domainResolved = 'veterinary';
    else if (input.medications && !input.profile) domainResolved = 'pharmacy';
    else if (input.profile || input.weight_kg || input.goal) domainResolved = 'nutrition';
    else if (input.crop_focus || input.soil) domainResolved = 'agro';
    else domainResolved = 'nutrition';
  }

  if (domainResolved === 'veterinary') {
    const vet = tryRequire('../veterinary');
    const runner = vet?.runConferenceWithLocalCare || vet?.runConference;
    if (runner) primary = runner(input);
  } else if (domainResolved === 'nutrition') {
    const nutri = tryRequire('../nutrition');
    if (nutri?.runNutritionConference) primary = nutri.runNutritionConference(input);
  } else if (domainResolved === 'agro') {
    const agro = tryRequire('../agro');
    if (agro?.runAgroConference) primary = agro.runAgroConference(input);
  } else if (domainResolved === 'pharmacy') {
    const ph = tryRequire('../pharmacy/PharmacyIntelligenceEngine');
    if (ph?.runPharmacyConference) primary = ph.runPharmacyConference(input);
  }

  // Pharmacy lens always available when meds present
  const pharmacy = tryRequire('../pharmacy/PharmacyIntelligenceEngine');
  let pharmacyResult = null;
  if (pharmacy && (input.medications || input.profile?.medications || domainResolved === 'pharmacy')) {
    pharmacyResult = pharmacy.runPharmacyConference({
      medications: input.medications || input.profile?.medications || [],
      conditions: input.conditions || input.profile?.conditions || [],
      species: input.species,
      foods_or_supplements: input.foods_or_supplements,
    });
  }

  const protocols = tryRequire('../protocols/ClinicalProtocolLibrary');
  const textBlob = [
    input.owner_observations,
    input.text,
    input.query,
    ...(input.clinical?.symptoms || []),
    ...(input.conditions || []),
    primary?.panel_summary,
  ].filter(Boolean).join(' ');
  const matchedProtocols = protocols
    ? protocols.matchProtocols({ text: textBlob, domain: domainResolved === 'veterinary' ? 'veterinary' : domainResolved === 'agro' ? 'agro' : undefined })
    : [];

  const analytics = tryRequire('../analytics/SystemsAnalyticsEngine');
  const analyticsResult = analytics
    ? analytics.analyticsBundle({
        protocols: matchedProtocols,
        herd_risk: primary?.herd_risk,
        clinical_flags: primary?.clinical_flags || [],
        interactions: pharmacyResult?.interactions || [],
        urgency: primary?.urgency,
      })
    : null;

  if (modesRequested.includes('clinical_decision')) {
    lenses.clinical_decision = {
      mode: 'clinical_decision',
      urgency: primary?.urgency || (matchedProtocols.some((p) => p.category === 'emergency') ? 'emergency' : 'routine'),
      isolation_recommended: primary?.isolation_recommended ?? null,
      notifiable_suspect: primary?.notifiable_suspect ?? null,
      decision:
        primary?.notifiable_suspect || primary?.urgency === 'emergency' || matchedProtocols.some((p) => p.escalate?.includes('EMERGENCY'))
          ? 'ESCALATE_NOW'
          : primary?.urgency === 'urgent'
            ? 'SEEK_CARE_SOON'
            : 'SUPPORTIVE_WITH_PROFESSIONAL_BACKUP',
      rationale: primary?.panel_summary || matchedProtocols[0]?.name || 'Review inputs',
    };
  }

  if (modesRequested.includes('scientific_research')) {
    lenses.scientific_research = {
      mode: 'scientific_research',
      differentials: primary?.differentials || null,
      evidence_items: primary?.treatment_options || primary?.natural_therapies || null,
      diagnostics: primary?.recommended_diagnostics || null,
      methodology: primary?.provenance || null,
      confidence_overall: primary?.confidence_overall ?? null,
    };
  }

  if (modesRequested.includes('generative_nextgen')) {
    lenses.generative_nextgen = {
      mode: 'generative_nextgen',
      plain_summary: primary?.panel_summary || pharmacyResult?.panel_summary || 'Analysis complete',
      care_plan_draft: {
        immediate: matchedProtocols.slice(0, 2).map((p) => p.steps?.[0]) || primary?.preventive_actions?.slice?.(0, 3),
        protocols: matchedProtocols.map((p) => p.name),
      },
      scenarios: [
        { id: 'best_case', note: 'Early professional confirmation; supportive measures' },
        { id: 'caution_case', note: 'Worsening → escalate; traditional-only insufficient' },
        { id: 'worst_case', note: 'Notifiable/emergency → official pathways only' },
      ],
    };
  }

  if (modesRequested.includes('ancient_wisdom')) {
    lenses.ancient_wisdom = {
      mode: 'ancient_wisdom',
      policy: 'Complementary only',
      ritu: primary?.ritu || null,
      ancestral: primary?.ancestral_therapies || primary?.local_care?.ancestral_customary_medicine || null,
      ethnovet: primary?.local_customary_notes || null,
    };
  }

  if (modesRequested.includes('systems_analytics')) {
    lenses.systems_analytics = {
      mode: 'systems_analytics',
      ...(analyticsResult || {}),
      herd_risk: primary?.herd_risk || null,
      calculator: primary?.calculator || null,
    };
  }

  if (modesRequested.includes('one_health')) {
    lenses.one_health = {
      mode: 'one_health',
      note: primary?.one_health_note || null,
      surveillance: primary?.one_health_surveillance || null,
      zoonotic_protocols: matchedProtocols.filter((p) => p.category === 'zoonosis'),
      all_matched_protocols_preview: matchedProtocols.map((p) => ({ id: p.id, category: p.category, name: p.name })),
    };
  }

  if (modesRequested.includes('pharmacy_intelligence')) {
    lenses.pharmacy_intelligence = {
      mode: 'pharmacy_intelligence',
      result: pharmacyResult,
    };
  }

  if (modesRequested.includes('protocol_engine')) {
    lenses.protocol_engine = {
      mode: 'protocol_engine',
      matched: matchedProtocols,
      categories_available: protocols?.categories || [],
    };
  }

  const clinical = lenses.clinical_decision;
  return {
    case_id,
    orchestra: 'MultiAIOrchestra',
    engine_tier: 'grok-highest-industry',
    competitive_position: 'Exceeds generic diet/chat AIs on protocols, pharmacy, One Health, multi-species; peers may lead on consumer photo-UX/telehealth rails',
    ai_modes_catalogue: AI_MODES,
    domain: domainResolved,
    primary_engine_result: primary,
    pharmacy: pharmacyResult,
    protocols_matched: matchedProtocols,
    analytics: analyticsResult,
    lenses,
    consensus: {
      action: clinical?.decision || 'REVIEW_WITH_PROFESSIONAL',
      domain: domainResolved,
      modes_fired: Object.keys(lenses),
      safety_floor: 'Licensed physician / veterinarian / pharmacist / dietitian remains final authority',
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { runMultiAIAnalysis, AI_MODES };
