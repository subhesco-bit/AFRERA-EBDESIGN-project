"use strict";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  DUAL_TRUTH,
  composeOs,
  remainingWork,
  mayInventRupee,
  stage0Complete,
  BLOCKED,
  REFUSED,
} = require("../osRegistry");

describe("AFRERA OS registry overlay", () => {
  it("Stage 0 is complete and does not claim GitHub is the kernel", () => {
    const os = composeOs();
    assert.equal(stage0Complete(), true);
    assert.equal(os.classified, 128);
    assert.equal(os.stage0Pct, 100);
    assert.equal(os.githubIntegrity, 7);
    assert.ok(os.kernelIntegrity < 40, `kernel ${os.kernelIntegrity}`);
    assert.ok(os.kernelIntegrity >= 20);
    assert.equal(DUAL_TRUTH.githubPlatform.integrity, 7);
    assert.equal(DUAL_TRUTH.latticeKernel.living, 45);
    assert.equal(os.stagesComplete, true);
    assert.equal(os.todoOpen, 0);
    assert.equal(os.todoBlocked, 0);
    assert.equal(os.aiParity, false);
    assert.equal(os.sapParity, false);
  });

  it("catalog is closed; tourism and human ICD stay refused, not painted living", () => {
    const next = remainingWork();
    assert.equal(next.length, 0);
    assert.equal(BLOCKED.length, 0);
    assert.ok(REFUSED.includes("tourism-itinerary"));
    assert.ok(REFUSED.includes("github-human-icd"));
    assert.ok(REFUSED.includes("ai-rupee-write"));
  });

  it("AI still cannot invent a rupee", () => {
    assert.equal(mayInventRupee(), false);
  });
});
