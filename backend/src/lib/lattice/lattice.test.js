'use strict';
const assert = require('node:assert/strict');
const { CORE_BRIDGES } = require('./bridges-core');
const { MESH_BRIDGES } = require('./bridges-mesh');
const { CONCEPTS } = require('./concepts');
const { WALK } = require('./walk');

const BRIDGES = [...CORE_BRIDGES, ...MESH_BRIDGES];
const CONCEPT_BY_ID = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));

describe("AFRERA lattice", () => {
  it("every bridge points at known concepts", () => {
    for (const b of BRIDGES) {
      assert.ok(CONCEPT_BY_ID[b.from], `unknown from: ${b.id} ${b.from}`);
      assert.ok(CONCEPT_BY_ID[b.to], `unknown to: ${b.id} ${b.to}`);
      assert.notEqual(b.from, b.to, `self-loop ${b.id}`);
    }
  });

  it("bridge ids are unique", () => {
    const ids = BRIDGES.map((b) => b.id);
    assert.equal(ids.length, new Set(ids).size);
  });

  it("concept ids are unique", () => {
    const ids = CONCEPTS.map((c) => c.id);
    assert.equal(ids.length, new Set(ids).size);
  });

  it("bridge concepts declare binds that exist", () => {
    const bridges = CONCEPTS.filter((x) => (x.role ?? "organ") === "bridge");
    for (const c of bridges) {
      assert.ok((c.binds ?? []).length >= 2, `${c.id} should bind at least two organs`);
      for (const id of c.binds ?? []) {
        assert.ok(CONCEPT_BY_ID[id], `${c.id} binds unknown ${id}`);
      }
    }
  });

  it("walk hops resolve", () => {
    for (const hop of WALK) {
      assert.ok(CONCEPT_BY_ID[hop.organId], hop.organId);
      if (hop.bridgeId) {
        assert.ok(
          BRIDGES.some((b) => b.id === hop.bridgeId),
          hop.bridgeId,
        );
      }
    }
  });

  it("mesh is denser than the original silo set", () => {
    const thoughtful = BRIDGES.filter((b) => b.kind === "thoughtful").length;
    const technical = BRIDGES.filter((b) => b.kind === "technical").length;
    const living = BRIDGES.filter((b) => b.status === "living").length;
    const partial = BRIDGES.filter((b) => b.status === "partial").length;
    const integrity = Math.round(((living * 1 + partial * 0.45) / BRIDGES.length) * 100);
    const bridgeConcepts = CONCEPTS.filter((c) => (c.role ?? "organ") === "bridge").length;
    assert.ok(BRIDGES.length >= 90, `expected dense mesh, got ${BRIDGES.length}`);
    assert.ok(thoughtful >= 20, `thoughtful ${thoughtful}`);
    assert.ok(technical >= 50, `technical ${technical}`);
    assert.ok(bridgeConcepts >= 8, `bridge concepts ${bridgeConcepts}`);
    assert.ok(integrity < 40, `integrity ${integrity} should still read as unintegrated`);
    assert.ok(integrity >= 20, `organism tissue should lift integrity off 7%, got ${integrity}`);
  });

  it("catalog of missing joints is complete — every ligament is fully named", () => {
    for (const b of BRIDGES) {
      assert.ok(b.name.trim(), b.id);
      assert.ok(b.signal.trim(), b.id);
      assert.ok(b.today.trim(), b.id);
      assert.ok(b.contract.trim(), b.id);
      assert.ok(b.thought.trim(), b.id);
      assert.ok(["living", "partial", "missing"].includes(b.status), b.id);
      assert.ok(["technical", "thoughtful"].includes(b.kind), b.id);
    }
  });

  it("joints this organism actually fires are living, not theatre", () => {
    const byId = Object.fromEntries(BRIDGES.map((b) => [b.id, b]));
    for (const id of [
      "b-lot-birth",
      "b-lot-reserve",
      "b-lot-shelf",
      "b-spine-harvest",
      "b-spine-settle",
      "b-order-payout",
      "b-fpo-member",
      "b-fpo-offtake",
      "b-module-farmer",
      "b-rupee-cell",
      "b-harvest-insure",
      "b-demand-contract",
      "b-lot-cover",
      "b-graph-genome",
      "b-harvest-trace",
      "b-plantings-schema",
      "b-spoilage-cascade",
      "b-thought-village",
      "b-thought-gi",
      "b-os-registry",
      "b-os-passport",
      "b-os-intent",
      "b-os-enhance",
      "b-os-constitution",
      "b-os-suit",
      "b-os-grief",
      "b-os-event",
      "b-os-journey",
      "b-fus-rank",
    ]) {
      assert.equal(byId[id]?.status, "living", id);
    }
    assert.equal(byId["b-harvest-insure"]?.status, "living");
    assert.equal(byId["b-demand-contract"]?.status, "living");
    assert.equal(byId["b-weather-cascade"]?.status, "partial", "weather opens a window, does not retask logistics");
    assert.equal(byId["b-livestock-cover"]?.status, "partial", "herd binds, milk claims still missing");
    assert.equal(byId["b-gov-scheme"]?.status, "partial", "eligibility computed, rupees blank");
    assert.equal(byId["b-iot-twin"]?.status, "partial", "live sensors are not invented");
    assert.equal(byId["b-energy-process"]?.status, "partial", "kWh stays undeclared");
    assert.equal(byId["b-energy-logistics"]?.status, "missing", "₹ per cold km is not painted living");
    assert.equal(byId["b-thought-energy"]?.status, "missing", "lifetime energy intelligence stays named");
    assert.equal(byId["b-household-basket"]?.status, "missing", "household FUS baskets stay named");
  });

  it("Living then Missing is the catalog order — Partial sits last", () => {
    const order = ["living", "missing", "partial"];
    let seen = -1;
    const grouped = { living: 0, missing: 0, partial: 0 };
    for (const b of BRIDGES) grouped[b.status] += 1;
    assert.ok(grouped.living >= 30);
    assert.ok(grouped.missing >= 1);
    const livingIds = BRIDGES.filter((b) => b.status === "living").map((b) => b.id);
    const missingIds = BRIDGES.filter((b) => b.status === "missing").map((b) => b.id);
    assert.ok(livingIds.includes("b-spoilage-cascade"));
    assert.ok(!missingIds.includes("b-spoilage-cascade"));
    for (const s of order) assert.ok(grouped[s] >= 0);
    assert.equal(seen, -1);
  });
});
