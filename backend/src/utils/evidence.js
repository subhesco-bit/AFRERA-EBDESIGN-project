/**
 * Evidence / provenance model — the project-wide standard for annotating
 * every value a service returns with where it came from and how much to
 * trust it, instead of a flat true/false "verified" flag.
 *
 * Originated in valueChainStudioService.js (2026-09-24) to fix a class of
 * bug where a service reported `verified: true` on a number derived from
 * as little as zero real data points. Extracted here so every service uses
 * the same taxonomy instead of re-inventing (and drifting from) it.
 *
 * Taxonomy:
 *   db          — read directly from a table, no derivation.
 *   calculated  — deterministic formula over real inputs (state the formula
 *                 in `methodology` — "verified" should mean "the inputs were
 *                 real," not "the formula ran without throwing").
 *   inferred    — a heuristic/keyword/rule-of-thumb, not a measurement.
 *                 Always verified: false — an inference is a planning
 *                 signal, never a fact, no matter how confident it looks.
 *   ai          — a model output (copy, image, summary). Always
 *                 verified: false — advisory only, never fed into another
 *                 calculation as if it were a fact.
 *   unavailable — the lookup was attempted and failed, or the precondition
 *                 for it wasn't met. Distinct from `inferred`: this is an
 *                 honest gap, not a guess filling the gap.
 */
'use strict';

const nowIso = () => new Date().toISOString();

/**
 * @param {string} source - one of db | calculated | inferred | ai | unavailable
 * @param {boolean} verified - true only for db/calculated backed by real data
 * @param {string|null} sourceRef - exact table/column/service this came from
 * @param {string|null} note - caveat shown to the end user
 * @param {string|null} methodology - the actual formula/rule, in plain language
 */
function evidence(source, verified, sourceRef, note = null, methodology = null) {
  return { source, verified, estimated: false, sourceRef, asOf: nowIso(), note, methodology };
}

const unavailable = (note) => evidence('unavailable', false, null, note);

const dbSourced = (sourceRef, verified = true, note = null) =>
  evidence('db', verified, sourceRef, note);

const calculatedSourced = (sourceRef, verified = true, methodology = null, note = null) =>
  evidence('calculated', verified, sourceRef, note, methodology);

// Always unverified by definition — see taxonomy note above.
const inferred = (sourceRef, note, methodology) =>
  evidence('inferred', false, sourceRef, note, methodology);

// Always unverified by definition — see taxonomy note above.
const aiSourced = (sourceRef, note, methodology = null) =>
  evidence('ai', false, sourceRef, note, methodology);

/**
 * Roll a provenance map (field -> evidence entry) up into a single
 * readiness score: what fraction of tracked fields are real, verified data
 * versus inferred/unavailable/advisory-only.
 */
function summarizeReadiness(provenance) {
  const entries = Object.values(provenance || {});
  const totalTrackedFields = entries.length;
  const verifiedFields = entries.filter((e) => e.verified).length;
  const inferredFields = entries.filter((e) => e.source === 'inferred').length;
  const unavailableFields = entries.filter((e) => e.source === 'unavailable').length;
  return {
    totalTrackedFields,
    verifiedFields,
    inferredFields,
    unavailableFields,
    readinessPct: totalTrackedFields ? Math.round((verifiedFields / totalTrackedFields) * 100) : 0,
  };
}

module.exports = {
  evidence,
  unavailable,
  dbSourced,
  calculatedSourced,
  inferred,
  aiSourced,
  summarizeReadiness,
};
