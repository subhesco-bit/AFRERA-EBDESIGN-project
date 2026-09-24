/**
 * Herd Risk Scoring Algorithm (Grok-tier)
 *
 * Multi-factor composite score 0–100 with transparent factor weights,
 * attack-rate epidemiology, biosecurity, vaccination, environmental,
 * and notifiable-disease amplification. Used by Specialist Panel and
 * One Health surveillance.
 *
 * Bands: low (0–24) | moderate (25–44) | high (45–69) | critical (70–100)
 */

const WEIGHTS = Object.freeze({
  mortality: 28,
  multi_animal: 18,
  attack_rate: 16,
  notifiable_differential: 22,
  recent_introductions: 12,
  vaccination_gap: 10,
  biosecurity_weak: 10,
  environmental_stress: 8,
  zoonotic_tag: 12,
  young_stock_wave: 8,
});

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function bandFromScore(score) {
  if (score >= 70) return 'critical';
  if (score >= 45) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

/**
 * @param {object} input
 * @param {object} [input.history]
 * @param {Array}  [input.differentials] - panel differentials with notifiable/tags/confidence
 * @param {object} [input.context] - optional biosecurity/environment flags
 */
function computeHerdRisk(input = {}) {
  const history = input.history || {};
  const differentials = input.differentials || [];
  const context = input.context || {};

  const affected = Number(history.affected_count || 0);
  const mortality = Number(history.mortality_count || 0);
  const herdSize = Number(history.herd_size || 0);
  const attackRate = herdSize > 0 ? affected / herdSize : null;
  const caseFatality = affected > 0 ? mortality / affected : mortality > 0 ? 1 : 0;

  const factors = [];
  let raw = 0;

  // Mortality
  if (mortality > 0) {
    const m = clamp(mortality, 1, 10);
    const pts = Math.round(WEIGHTS.mortality * (0.5 + 0.5 * (m / 10)));
    raw += pts;
    factors.push({ id: 'mortality', points: pts, detail: `${mortality} death(s); CFR≈${Math.round(caseFatality * 100)}%` });
  }

  // Multi-animal
  if (affected > 1) {
    const pts = clamp(Math.round(WEIGHTS.multi_animal * Math.min(1, Math.log2(affected) / 3)), 6, WEIGHTS.multi_animal);
    raw += pts;
    factors.push({ id: 'multi_animal', points: pts, detail: `${affected} animals affected` });
  }

  // Attack rate
  if (attackRate != null && attackRate > 0) {
    let pts = 0;
    if (attackRate >= 0.3) pts = WEIGHTS.attack_rate;
    else if (attackRate >= 0.1) pts = Math.round(WEIGHTS.attack_rate * 0.7);
    else if (attackRate >= 0.05) pts = Math.round(WEIGHTS.attack_rate * 0.4);
    else pts = Math.round(WEIGHTS.attack_rate * 0.2);
    raw += pts;
    factors.push({ id: 'attack_rate', points: pts, detail: `attack rate ${(attackRate * 100).toFixed(1)}%` });
  }

  // Notifiable differentials
  const notifiableHits = differentials.filter((d) => d.notifiable && (d.confidence || 0) >= 0.18);
  if (notifiableHits.length) {
    const best = Math.max(...notifiableHits.map((d) => d.confidence || 0));
    const pts = Math.round(WEIGHTS.notifiable_differential * (0.6 + 0.4 * best));
    raw += pts;
    factors.push({
      id: 'notifiable_differential',
      points: pts,
      detail: notifiableHits.map((d) => d.name || d.disease_id).join(', '),
    });
  }

  // Introductions
  if (history.recent_introductions) {
    raw += WEIGHTS.recent_introductions;
    factors.push({ id: 'recent_introductions', points: WEIGHTS.recent_introductions, detail: 'recent animal movements/introductions' });
  }

  // Vaccination gap
  const vax = String(history.vaccination_status || '').toLowerCase();
  if (vax === 'none') {
    raw += WEIGHTS.vaccination_gap;
    factors.push({ id: 'vaccination_gap', points: WEIGHTS.vaccination_gap, detail: 'no vaccination history declared' });
  } else if (vax === 'partial' || vax === 'unknown') {
    const pts = Math.round(WEIGHTS.vaccination_gap * 0.6);
    raw += pts;
    factors.push({ id: 'vaccination_gap', points: pts, detail: `vaccination status: ${vax}` });
  }

  // Biosecurity
  if (context.shared_water || context.mixed_species || context.open_boundary || context.no_quarantine_protocol) {
    raw += WEIGHTS.biosecurity_weak;
    factors.push({ id: 'biosecurity_weak', points: WEIGHTS.biosecurity_weak, detail: 'weak biosecurity flags present' });
  }

  // Environment
  const weather = String(history.weather_notes || context.weather || '').toLowerCase();
  if (/heat|humid|flood|monsoon|dust|cold stress/.test(weather) || context.heat_stress) {
    raw += WEIGHTS.environmental_stress;
    factors.push({ id: 'environmental_stress', points: WEIGHTS.environmental_stress, detail: 'environmental stress context' });
  }

  // Zoonotic tag on differentials
  if (differentials.some((d) => (d.tags || []).includes('zoonotic_risk') && (d.confidence || 0) >= 0.2)) {
    raw += WEIGHTS.zoonotic_tag;
    factors.push({ id: 'zoonotic_tag', points: WEIGHTS.zoonotic_tag, detail: 'zoonotic-risk differential present' });
  }

  // Young stock wave
  const stageBlob = String(input.production_stage_summary || history.dominant_stage || '').toLowerCase();
  if (/calf|piglet|kid|chick|neonat/.test(stageBlob) && affected > 1) {
    raw += WEIGHTS.young_stock_wave;
    factors.push({ id: 'young_stock_wave', points: WEIGHTS.young_stock_wave, detail: 'young-stock multi-animal pattern' });
  }

  const score = clamp(Math.round(raw), 0, 100);
  const band = bandFromScore(score);

  const recommended_actions = [];
  if (band === 'critical' || band === 'high') {
    recommended_actions.push('Heighten surveillance; restrict movement; contact licensed veterinarian');
  }
  if (notifiableHits.length) {
    recommended_actions.push('Initiate notifiable-disease reporting pathway with competent authority');
  }
  if (factors.some((f) => f.id === 'zoonotic_tag')) {
    recommended_actions.push('PPE for handlers; separate animal and household water; One Health notification if human illness');
  }
  if (factors.some((f) => f.id === 'vaccination_gap')) {
    recommended_actions.push('Audit vaccination records against local/national schedule');
  }
  if (!recommended_actions.length) {
    recommended_actions.push('Maintain routine biosecurity and health monitoring');
  }

  return {
    score,
    band,
    attack_rate: attackRate,
    case_fatality_ratio: caseFatality,
    factors,
    weights_version: '2026.09.herd-v2',
    recommended_actions,
    algorithm: 'weighted_composite_herd_risk_v2',
  };
}

module.exports = {
  computeHerdRisk,
  bandFromScore,
  WEIGHTS,
};
