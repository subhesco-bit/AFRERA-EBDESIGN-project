/**
 * Decision Quality & Evaluation Engine
 * Algorithms: confidence fusion, evidence weighting, disagreement detection,
 * escalation scoring, communication clarity score.
 */

const { randomUUID } = require('crypto');
// Project-wide evidence/provenance standard (see .ai/decisions/0003-evidence-provenance-standard.md).
// This engine backs the shared /enhanced endpoint for vet, nutrition and agro
// (via AgroEnhancedOperate.js et al.), so tagging confidence honestly here
// covers all three modules in one place instead of three separate retrofits.
const { calculatedSourced, unavailable } = require('../../utils/evidence');

/** Fuse multiple confidence signals (0-1) with optional weights */
function fuseConfidence(signals = []) {
  if (!signals.length) return { value: 0.2, method: 'default_low', n: 0 };
  let wSum = 0;
  let vSum = 0;
  for (const s of signals) {
    const w = Number(s.weight != null ? s.weight : 1);
    const v = Math.max(0, Math.min(1, Number(s.value) || 0));
    wSum += w;
    vSum += w * v;
  }
  const value = wSum > 0 ? vSum / wSum : 0.2;
  const spread =
    signals.length > 1
      ? Math.max(...signals.map((s) => Number(s.value) || 0)) -
        Math.min(...signals.map((s) => Number(s.value) || 0))
      : 0;
  return {
    value: Math.round(value * 1000) / 1000,
    method: 'weighted_mean',
    n: signals.length,
    disagreement: spread > 0.35,
    spread: Math.round(spread * 1000) / 1000,
  };
}

/** Map urgency + confidence + notifiable → escalation band */
function escalationScore({ urgency, confidence, notifiable, major_interaction, vision_severity }) {
  let score = 0;
  const factors = [];
  if (urgency === 'emergency') {
    score += 45;
    factors.push({ id: 'emergency', pts: 45 });
  } else if (urgency === 'urgent') {
    score += 28;
    factors.push({ id: 'urgent', pts: 28 });
  } else if (urgency === 'soon') {
    score += 12;
    factors.push({ id: 'soon', pts: 12 });
  }
  if (notifiable) {
    score += 30;
    factors.push({ id: 'notifiable', pts: 30 });
  }
  if (major_interaction) {
    score += 15;
    factors.push({ id: 'drug_interaction', pts: 15 });
  }
  if (vision_severity === 'high') {
    score += 10;
    factors.push({ id: 'vision_high', pts: 10 });
  }
  if (confidence != null && confidence < 0.25) {
    score += 8;
    factors.push({ id: 'low_confidence', pts: 8 });
  }
  score = Math.min(100, score);
  let band = 'monitor';
  if (score >= 70) band = 'escalate_now';
  else if (score >= 40) band = 'seek_professional_soon';
  else if (score >= 20) band = 'plan_and_monitor';
  return { score, band, factors };
}

/** Evaluate a decision package for quality / completeness */
function evaluateDecisionPackage(pkg = {}) {
  const checks = [];
  const add = (id, ok, detail) => checks.push({ id, ok: !!ok, detail });

  add('has_action', !!pkg.action, 'Consensus action present');
  add('has_safety_floor', !!pkg.safety_floor, 'Safety floor stated');
  add('has_confidence', pkg.confidence != null, 'Confidence reported');
  add('has_rationale', !!(pkg.rationale || pkg.summary), 'Human rationale');
  add('module_cited', !!(pkg.modules_touched && pkg.modules_touched.length), 'Modules cited');
  add('escalation_clear', !!pkg.escalation?.band, 'Escalation band');

  const passed = checks.filter((c) => c.ok).length;
  const quality = Math.round((passed / checks.length) * 100);

  return {
    evaluation_id: randomUUID(),
    quality_score: quality,
    grade: quality >= 90 ? 'A' : quality >= 75 ? 'B' : quality >= 60 ? 'C' : 'D',
    checks,
    recommendation:
      quality < 75
        ? 'Enrich package with missing rationale/confidence/modules before user display'
        : 'Package meets decision-communication standard',
  };
}

function buildDecisionPackage(input = {}) {
  const signals = input.confidence_signals || [];
  if (input.confidence != null) signals.push({ value: input.confidence, weight: 1.2, source: 'primary' });
  const fused = fuseConfidence(signals);
  const escalation = escalationScore({
    urgency: input.urgency,
    confidence: fused.value,
    notifiable: input.notifiable,
    major_interaction: input.major_interaction,
    vision_severity: input.vision_severity,
  });

  const confidenceProvenance = signals.length === 0
    ? unavailable('No confidence signals were supplied — this is the engine\'s default-low fallback, not a measurement.')
    : calculatedSourced(
        signals.map((s) => s.source || 'unlabeled').join(', '),
        true,
        'weighted mean of confidence_signals (value*weight / total weight), flagged as disagreement when spread > 0.35',
      );

  const pkg = {
    decision_id: randomUUID(),
    action: input.action || escalation.band.toUpperCase(),
    confidence: fused,
    provenance: { confidence: confidenceProvenance },
    escalation,
    rationale: input.rationale || input.summary || 'See module lenses',
    summary: input.summary,
    modules_touched: input.modules_touched || [],
    safety_floor:
      input.safety_floor ||
      'Licensed professionals and competent authorities remain final decision-makers',
    human_message: null,
    generatedAt: new Date().toISOString(),
  };

  pkg.human_message = composeHumanMessage(pkg, input);
  pkg.evaluation = evaluateDecisionPackage(pkg);
  return pkg;
}

function composeHumanMessage(pkg, input = {}) {
  const confPct = Math.round((pkg.confidence?.value || 0) * 100);
  const lines = [];
  lines.push(`Decision: ${pkg.action} (confidence ~${confPct}%).`);
  lines.push(`Escalation: ${pkg.escalation.band.replace(/_/g, ' ')}.`);
  if (pkg.confidence?.disagreement) {
    lines.push('Note: module signals disagreed — treat as lower certainty.');
  }
  if (input.next_steps?.length) {
    lines.push('Next: ' + input.next_steps.slice(0, 3).join('; ') + '.');
  }
  lines.push(pkg.safety_floor);
  return lines.join(' ');
}

module.exports = {
  fuseConfidence,
  escalationScore,
  evaluateDecisionPackage,
  buildDecisionPackage,
  composeHumanMessage,
};
