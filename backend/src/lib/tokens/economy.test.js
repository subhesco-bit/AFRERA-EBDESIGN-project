'use strict';
const assert = require('node:assert/strict');
const { CANONICAL_QUERIES } = require('../library/queries');
const { composeEconomy, compactEnvelope, consultEconomy, estimateTokens, naiveDump, resetEconomyCache, shouldCallLlm } = require('./economy');

describe("token economy", () => {
  it("packs a consult far below the GitHub dump and never calls an LLM", () => {
    resetEconomyCache();
    const naive = estimateTokens(naiveDump());
    const compact = estimateTokens(compactEnvelope("Why did harvest die at the portal?").text);
    assert.ok(naive > 8_000, `naive dump too small to be the cadaver: ${naive}`);
    assert.ok(compact < naive * 0.005, `compact ${compact} not under 0.5% of naive ${naive}`);
    const saved = ((naive - compact) / naive) * 100;
    assert.ok(saved >= 99.5, `saved ${saved.toFixed(2)}%`);
    const r = consultEconomy("Why did harvest die at the portal?");
    assert.equal(r.llmCalls, 0);
    assert.ok(r.hits.length >= 1);
  });

  it("batches every reflex and caches the second pass", () => {
    const snap = composeEconomy();
    assert.equal(snap.receipts.length, CANONICAL_QUERIES.length);
    assert.equal(snap.llmCalls, 0);
    assert.equal(snap.cacheHits, CANONICAL_QUERIES.length);
    assert.ok(snap.batchSavedPct >= 99.5, `batch ${snap.batchSavedPct}`);
    assert.ok(snap.plugins.some((p) => p.id === "llm-gate"));
    assert.ok(snap.plugins.some((p) => p.id === "batch"));
  });

  it("does not call a model when the library already holds the card", () => {
    assert.equal(shouldCallLlm("How does the token economy pack library hits instead of dumping GitHub modules into an LLM?"), false);
  });
});
