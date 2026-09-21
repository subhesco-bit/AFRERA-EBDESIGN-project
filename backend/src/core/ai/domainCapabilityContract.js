'use strict';

const { AUTONOMY, CLASSES } = require('./capabilityClasses');

// The seven governance classes are distinct from the analytical, decision,
// conversational and other application tiers in the source inventory.
const DOMAIN_BINDINGS = Object.freeze({
  'recipe.masterchef': { classId: 'frontier_models', autonomy: AUTONOMY.ADVISE, evidence: ['verified_ingredients', 'allergens', 'regional_availability', 'unit_cost', 'yield', 'source_date'] },
  'nutrition.value': { classId: 'frontier_models', autonomy: AUTONOMY.ADVISE, evidence: ['lab_or_reference_source', 'serving_basis', 'batch', 'uncertainty', 'effective_date'] },
  'dietitian.natural_therapy': { classId: 'frontier_models', autonomy: AUTONOMY.ADVISE, evidence: ['consent', 'allergens', 'local_foods', 'culture_preferences', 'clinical_escalation'] },
  'veterinary.guidance': { classId: 'frontier_models', autonomy: AUTONOMY.ADVISE, evidence: ['species', 'age', 'symptoms', 'local_disease_context', 'licensed_vet_escalation'] },
  'poultry.guidance': { classId: 'frontier_models', autonomy: AUTONOMY.ADVISE, evidence: ['flock', 'mortality', 'symptoms', 'biosecurity', 'licensed_vet_escalation'] },
  'fisheries.guidance': { classId: 'frontier_models', autonomy: AUTONOMY.ADVISE, evidence: ['species', 'water_quality', 'stocking', 'symptoms', 'licensed_vet_escalation'] },
  'engineering.mep': { classId: 'frontier_models', autonomy: AUTONOMY.ADVISE, evidence: ['site', 'load', 'design_standard', 'version', 'licensed_engineer_review'] },
  'weather.advisory': { classId: 'frontier_models', autonomy: AUTONOMY.ADVISE, evidence: ['district', 'observed_or_grid', 'source_time', 'forecast_horizon', 'uncertainty'] },
  'scientist.forecast_validation': { classId: 'artificial_scientists', autonomy: AUTONOMY.OBSERVE, evidence: ['hypothesis', 'data_source', 'outturn', 'scoring_rule'] },
  'commerce.dynamic_pricing': { classId: 'agentic', autonomy: AUTONOMY.ADVISE, evidence: ['authorized_feed', 'source_terms', 'market_timestamp', 'landed_cost', 'margin_floor', 'buyer_fairness'] },
  'erp.cost_optimization': { classId: 'agentic', autonomy: AUTONOMY.ADVISE, evidence: ['baseline', 'hard_constraints', 'candidate_cost', 'quality_impact', 'named_approver'] },
  'security.fraud_freeze': { classId: 'security_trust', autonomy: AUTONOMY.REFLEX, evidence: ['preauthorization', 'calibrated_signal', 'timing_budget', 'named_actor', 'audit_event'] },
  'robotics.mission': { classId: 'embodied', autonomy: AUTONOMY.ADVISE, evidence: ['certification', 'telemetry', 'safety_budget', 'operator_approval'] },
  'quantum.optimization': { classId: 'quantum_optimisation', autonomy: AUTONOMY.ADVISE, evidence: ['hard_constraints', 'classical_baseline', 'feasibility', 'solver_provenance'] },
});

const RANK = { [AUTONOMY.OBSERVE]: 0, [AUTONOMY.ADVISE]: 1, [AUTONOMY.ACT]: 2, [AUTONOMY.REFLEX]: 3 };

function authorizeDomain(domain, requestedAutonomy, evidence = {}) {
  const binding = DOMAIN_BINDINGS[domain];
  if (!binding) return { allowed: false, reason: 'unclassified_domain' };
  const capability = CLASSES[binding.classId];
  if (!capability || capability.state === 'ABSENT') return { allowed: false, reason: 'capability_unavailable', domain };
  if (!(requestedAutonomy in RANK) || RANK[requestedAutonomy] > RANK[binding.autonomy] || RANK[requestedAutonomy] > RANK[capability.autonomy]) {
    return { allowed: false, reason: 'autonomy_exceeded', domain, granted: binding.autonomy };
  }
  const missing = binding.evidence.filter((key) => evidence[key] === undefined || evidence[key] === null || evidence[key] === '');
  if (missing.length) return { allowed: false, reason: 'missing_evidence', domain, missing };
  if (requestedAutonomy === AUTONOMY.ACT && (!evidence.named_approver || !evidence.authority_gate)) {
    return { allowed: false, reason: 'authority_gate_required', domain };
  }
  return { allowed: true, domain, classId: binding.classId, autonomy: requestedAutonomy, evidenceKeys: binding.evidence };
}

module.exports = { DOMAIN_BINDINGS, authorizeDomain };
