/**
 * Multi-Criteria Decision Analysis (MCDA).
 *
 * PROVENANCE
 * Recovered from afrera_platform_v43.html (2026-08-03). This framework, and
 * the business rules built on it, existed only in that 13,020-line prototype
 * and were lost when the platform was ported to React + Express — 13 of 14
 * high-value decision functions had no equivalent anywhere in backend/ or
 * frontend/. This module restores the framework as tested, reusable code.
 *
 * WHY IT MATTERS MORE THAN THE "AI" IT SITS BESIDE
 * The advancedAIService previously returned Math.random() behind confident
 * labels like "94% accuracy". This framework does the opposite: it is explicit
 * about how much of a recommendation rests on real data versus assumption, and
 * about which single input the answer is most fragile to.
 *
 * Three properties worth preserving deliberately:
 *
 *  1. WEIGHTS MUST SUM TO 1.0 — enforced, not assumed. Silently renormalising
 *     would hide a mis-specified model.
 *  2. CONFIDENCE COMES FROM DATA PROVENANCE — each criterion declares whether
 *     its score is 'real', 'estimated' or 'assumed'. A recommendation built on
 *     assumptions reports low confidence and says so in plain words.
 *  3. SENSITIVITY IS REPORTED — the criterion contributing most is surfaced, so
 *     a user can see what would have to change to flip the decision.
 *
 * These outputs are intended to be shown to a farmer or a buyer, not buried in
 * a log. Language stays plain for that reason.
 */

/** Weight applied to a criterion's contribution to overall confidence. */
const DATA_QUALITY_WEIGHT = Object.freeze({
  real: 1,        // measured or recorded fact
  estimated: 0.7, // derived from a model or proxy
  assumed: 0.4    // a stated assumption with no backing data
});

const DEFAULT_DATA_QUALITY = 0.5;

/**
 * Evaluate a weighted criteria set.
 *
 * @param {Array<{name:string, weight:number, score:number, dataQuality?:'real'|'estimated'|'assumed'}>} criteria
 *        weight: 0..1, must sum to 1.0 across the set
 *        score:  0..100
 * @returns {{total, confidence, criteria, mostSensitiveTo, verdict, confidenceLabel}}
 */
function mcda(criteria) {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new Error('MCDA requires a non-empty criteria array');
  }

  for (const c of criteria) {
    if (!c || typeof c.name !== 'string') {
      throw new Error('Each MCDA criterion requires a name');
    }
    if (!Number.isFinite(c.weight) || c.weight < 0) {
      throw new Error(`Criterion "${c.name}" has an invalid weight`);
    }
    if (!Number.isFinite(c.score)) {
      throw new Error(`Criterion "${c.name}" has an invalid score`);
    }
  }

  const weightSum = criteria.reduce((s, c) => s + c.weight, 0);
  // Enforced rather than auto-normalised: weights that do not sum to 1 mean the
  // model is mis-specified, and silently fixing it would hide the mistake.
  if (Math.abs(weightSum - 1) > 0.01) {
    throw new Error(`MCDA weights must sum to 1.0 (got ${weightSum.toFixed(2)})`);
  }

  const round1 = (n) => Math.round(n * 10) / 10;

  const weighted = criteria.map((c) => {
    const score = Math.max(0, Math.min(100, c.score)); // clamp to the declared scale
    return {
      ...c,
      score,
      contribution: round1(c.weight * score)
    };
  });

  const total = round1(weighted.reduce((s, c) => s + c.contribution, 0));

  const confidence = Math.round(
    criteria.reduce(
      (s, c) => s + (DATA_QUALITY_WEIGHT[c.dataQuality] ?? DEFAULT_DATA_QUALITY) * c.weight,
      0
    ) * 100
  );

  // The criterion the result leans on hardest — what would have to change.
  const mostSensitive = [...weighted].sort((a, b) => b.contribution - a.contribution)[0];

  return {
    total,
    confidence,
    criteria: weighted,
    mostSensitiveTo: mostSensitive.name,
    verdict: total >= 70 ? 'Strong' : total >= 45 ? 'Moderate' : 'Weak',
    confidenceLabel:
      confidence >= 80
        ? 'High confidence'
        : confidence >= 55
          ? 'Moderate confidence'
          : 'Low confidence — mostly assumptions'
  };
}

/**
 * Compare options scored on the SAME criteria set and rank them.
 * Returns ranked results plus the margin between first and second — a narrow
 * margin means the choice is close and probably should not be automated.
 */
function rankOptions(options) {
  if (!Array.isArray(options) || options.length === 0) return { ranked: [], margin: 0, decisive: false };

  const ranked = options
    .map((o) => ({ ...o, result: mcda(o.criteria) }))
    .sort((a, b) => b.result.total - a.result.total);

  const margin = ranked.length > 1
    ? Math.round((ranked[0].result.total - ranked[1].result.total) * 10) / 10
    : ranked[0].result.total;

  return {
    ranked,
    margin,
    // A <5-point gap is inside the noise of a subjective weighting.
    decisive: margin >= 5,
    note: margin < 5 && ranked.length > 1
      ? 'Top options are within 5 points — treat this as a close call, not a clear winner.'
      : null
  };
}

/**
 * MCDA score passed through the agent's earned calibration gate.
 *
 * THIS IS THE STEP THAT MAKES THE LEARNING LOOP A LOOP.
 *
 * `mcda()` weights criteria by the PROVENANCE of their inputs — real 1.0,
 * estimated 0.7, assumed 0.4. That answers "how good is the data?" It does not
 * answer "how good is the agent that read it?", and until now nothing did.
 * `core/outcomeResolver.js` derives that second number from every prediction
 * the agent has made and had scored against reality, and nothing called it.
 *
 * An agent claiming 92% confidence while running 18% accurate had exactly the
 * same influence over a decision as one running 91%. Now it does not: its score
 * is multiplied by 0.25 and `mayAutoExecute` goes false.
 *
 * Two multipliers, deliberately kept separate:
 *
 *   dataConfidence   how trustworthy the INPUTS are   (mcda, provenance)
 *   authority        how trustworthy the READER is    (gate, track record)
 *
 * Good data read by an unreliable agent, and bad data read by a reliable one,
 * are different failures needing different fixes. Collapsing them into one
 * number would hide which of the two is actually wrong.
 *
 * Async because the gate is a database read. Callers that cannot await should
 * keep using mcda() and accept that they are ignoring the agent's record.
 */
async function gatedMcda(actorId, criteria) {
  const base = mcda(criteria);

  let gate;
  try {
    // Required lazily: outcomeResolver reads the DB, and core/mcda.js is
    // imported by pure-function tests that must not need a database.
    ({ gateFor: gate } = require('./outcomeResolver'));
  } catch {
    return { ...base, gate: null, effectiveTotal: base.total, mayAutoExecute: false,
      gateNote: 'Calibration gate unavailable — treating as unproven rather than trusted.' };
  }

  let g;
  try {
    g = await gate(actorId);
  } catch (err) {
    // A gate that cannot be read must fail CLOSED. Falling back to full
    // authority on error would mean an agent gains influence precisely when
    // the system has lost the ability to check it.
    return { ...base, gate: 'unreadable', effectiveTotal: Math.round(base.total * 0.5 * 10) / 10,
      mayAutoExecute: false,
      gateNote: `Could not read the calibration gate (${err.message}). Authority halved — `
              + 'an unverifiable record is not a good one.' };
  }

  const effectiveTotal = Math.round(base.total * g.authorityMultiplier * 10) / 10;
  return {
    ...base,
    actorId,
    gate: g.gate,
    authorityMultiplier: g.authorityMultiplier,
    calibrationGap: g.calibrationGap,
    resolvedPredictions: g.resolved,
    effectiveTotal,
    // Verdict is restated against the DISCOUNTED score. A "Strong" that
    // survives only at face value is not strong.
    effectiveVerdict: effectiveTotal >= 70 ? 'Strong' : effectiveTotal >= 45 ? 'Moderate' : 'Weak',
    mayAutoExecute: (g.gate === 'trusted' || g.gate === 'discounted') && base.confidence >= 55,
    gateNote: g.note,
  };
}

module.exports = { mcda, rankOptions, gatedMcda, DATA_QUALITY_WEIGHT };
