"use strict";

/**
 * AFRERA OS registry snapshot for consolidated/final.
 * Stage 0 classification is complete. GitHub platform remains 7%.
 * This is a kernel overlay, not a claim that 156 folders now run.
 *
 * Dual truth:
 *   GitHub platform  7%   (3 living / 13 partial / 108 missing of 124)
 *   Lattice kernel  39%   (45 living / 22 partial / 73 missing of 140)
 */

const DUAL_TRUTH = Object.freeze({
  githubPlatform: { living: 3, partial: 13, missing: 108, of: 124, integrity: 7 },
  latticeKernel: { living: 45, partial: 22, missing: 73, of: 140, integrity: 39 },
});

const STAGES = Object.freeze([
  { stage: 0, name: "Concept reconciliation", done: 6, total: 6, pct: 100 },
  { stage: 1, name: "Industry baseline", done: 21, total: 32, pct: 66 },
  { stage: 2, name: "Sector excellence", done: 3, total: 22, pct: 14 },
  { stage: 3, name: "Intelligent assistance", done: 9, total: 23, pct: 39 },
  { stage: 4, name: "System intelligence", done: 3, total: 10, pct: 30 },
  { stage: 5, name: "Autonomous ecosystem", done: 0, total: 5, pct: 0 },
  { stage: 6, name: "Futuristic platform", done: 0, total: 12, pct: 0 },
]);

const SNAPSHOT = Object.freeze({
  items: 110,
  classified: 110,
  stage0Pct: 100,
  kernelVerified: 20,
  kernelPartial: 62,
  todoDone: 42,
  todoOpen: 60,
  todoBlocked: 8,
  thesis:
    "AFRERA is a rural economic operating system, not an agriculture website. Stage 0 classified every concept. Stage 1 bone lives (clerk, remaining grams, journal, workflows). Four-level enhance is on. GitHub platform remains 7%. Do not generate a thousand pages. Plug a ligament.",
});

/** Next ligaments to plug. Do not invent rupees. Blocked items stay blocked. */
const REMAINING = Object.freeze([
  { id: "b-a11y", stage: 1, title: "Accessibility", status: "open" },
  { id: "b-erpctl", stage: 1, title: "ERP control", status: "open" },
  { id: "b-i18n", stage: 1, title: "Multilingual", status: "open" },
  { id: "b-obs", stage: 1, title: "Observability", status: "open" },
  { id: "b-off", stage: 1, title: "Offline", status: "open" },
  { id: "b-rel", stage: 1, title: "Reliability", status: "open" },
  { id: "b-sec", stage: 1, title: "Security", status: "open" },
  { id: "c-erp", stage: 1, title: "Enterprise ERP", status: "open" },
  { id: "g-erp", stage: 1, title: "Unified ERP control", status: "open" },
  { id: "g-prod", stage: 1, title: "Production verification", status: "open" },
  { id: "g-workflow", stage: 1, title: "State-driven workflows", status: "open" },
  { id: "a-travel", stage: 2, title: "Contextual journey planner", status: "blocked" },
]);

const BLOCKED = Object.freeze([
  "g-eng",
  "c-eng",
  "a-travel",
  "n-profile",
  "f-fed",
  "f-policy",
  "f-infra",
]);

function composeOs() {
  return {
    ...SNAPSHOT,
    dualTruth: DUAL_TRUTH,
    stages: STAGES,
    remaining: REMAINING,
    blocked: BLOCKED,
    githubIntegrity: DUAL_TRUTH.githubPlatform.integrity,
    kernelIntegrity: DUAL_TRUTH.latticeKernel.integrity,
  };
}

function remainingWork(limit = 12) {
  return REMAINING.filter((t) => t.status !== "done").slice(0, limit);
}

function mayInventRupee() {
  return false;
}

function stage0Complete() {
  return SNAPSHOT.classified === SNAPSHOT.items && SNAPSHOT.stage0Pct === 100;
}

module.exports = {
  DUAL_TRUTH,
  STAGES,
  SNAPSHOT,
  REMAINING,
  BLOCKED,
  composeOs,
  remainingWork,
  mayInventRupee,
  stage0Complete,
};
