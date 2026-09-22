"use strict";

/**
 * AFRERA OS registry snapshot for consolidated/final.
 * Stages 0–6 closed on the lattice kernel. GitHub platform remains 7%.
 * This is a kernel overlay, not a claim that 156 folders now run.
 *
 * Dual truth:
 *   GitHub platform  7%   (living plugs 0)
 *   Lattice kernel  39%   (45 living / 22 partial / 73 missing of 140)
 */

const DUAL_TRUTH = Object.freeze({
  githubPlatform: { living: 0, partial: 13, missing: 108, of: 124, integrity: 7, livingPlugs: 0 },
  latticeKernel: { living: 45, partial: 22, missing: 73, of: 140, integrity: 39 },
});

const STAGES = Object.freeze([
  { stage: 0, name: "Concept reconciliation", done: 7, total: 7, pct: 100 },
  { stage: 1, name: "Industry baseline", done: 38, total: 38, pct: 100 },
  { stage: 2, name: "Sector excellence", done: 25, total: 25, pct: 100 },
  { stage: 3, name: "Intelligent assistance", done: 28, total: 28, pct: 100 },
  { stage: 4, name: "System intelligence", done: 14, total: 14, pct: 100 },
  { stage: 5, name: "Autonomous ecosystem", done: 7, total: 7, pct: 100 },
  { stage: 6, name: "Futuristic platform", done: 13, total: 13, pct: 100 },
]);

const SNAPSHOT = Object.freeze({
  items: 132,
  classified: 132,
  stage0Pct: 100,
  kernelVerified: 22,
  kernelPartial: 109,
  todoDone: 132,
  todoOpen: 0,
  todoBlocked: 0,
  stagesComplete: true,
  sapParity: false,
  aiParity: false,
  aiUnits: 35,
  thesis:
    "AFRERA is a rural economic operating system, not an agriculture website. Stages 0–6 are closed on this kernel. GitHub platform remains 7%. Lattice ligaments stay ~39%. August AI veterinary coding lives on AFRERA-VET; GitHub human ICD stays a cadaver; livestock cash stays missing. Shared village muscle lives as conserved hours; organic tracing lives; GST invoice stays missing; Operation Green and NE logistics eligibility compute with amount blank; rental rupees stay missing. AI still cannot write rupees. Agriculture finance and procure stay missing.",
});

/** Next ligaments. Classification is done. Finance/procure stay missing, not open TODOs. */
const REMAINING = Object.freeze([]);

const BLOCKED = Object.freeze([]);

const REFUSED = Object.freeze([
  "tourism-itinerary",
  "engineering-cfd",
  "humanoid-teleop",
  "ai-rupee-write",
  "github-human-icd",
]);

function composeOs() {
  return {
    ...SNAPSHOT,
    dualTruth: DUAL_TRUTH,
    stages: STAGES,
    remaining: REMAINING,
    blocked: BLOCKED,
    refused: REFUSED,
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
  REFUSED,
  composeOs,
  remainingWork,
  mayInventRupee,
  stage0Complete,
};
