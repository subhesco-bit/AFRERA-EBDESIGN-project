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
} = require("../osRegistry");

describe("AFRERA OS registry overlay", () => {
  it("Stage 0 is complete and does not claim GitHub is the kernel", () => {
    const os = composeOs();
    assert.equal(stage0Complete(), true);
    assert.equal(os.classified, 110);
    assert.equal(os.stage0Pct, 100);
    assert.equal(os.githubIntegrity, 7);
    assert.ok(os.kernelIntegrity < 40, `kernel ${os.kernelIntegrity}`);
    assert.ok(os.kernelIntegrity >= 20);
    assert.equal(DUAL_TRUTH.githubPlatform.integrity, 7);
    assert.equal(DUAL_TRUTH.latticeKernel.living, 45);
  });

  it("remaining work is stage-ordered and travel stays blocked", () => {
    const next = remainingWork();
    assert.ok(next.length >= 8);
    assert.equal(next[0].stage, 1);
    assert.ok(BLOCKED.includes("a-travel"));
    assert.equal(next.find((t) => t.id === "a-travel")?.status, "blocked");
  });

  it("AI still cannot invent a rupee", () => {
    assert.equal(mayInventRupee(), false);
  });
});
