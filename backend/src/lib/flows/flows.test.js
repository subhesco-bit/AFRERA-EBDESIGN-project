'use strict';
const assert = require('node:assert/strict');
const { FLOWS } = require('./catalog');
const { defaultFlowFacts, flowStats, runAllFlows, runFlow, runNode } = require('./run');

describe("village flow charts", () => {
  it("names eleven flow families and never paints missing living", () => {
    assert.equal(FLOWS.length, 11);
    const ids = FLOWS.map((f) => f.id);
    assert.equal(ids.length, new Set(ids).size);
    for (const f of FLOWS) {
      assert.ok(f.nodes.length >= 4, f.id);
      assert.ok(f.thesis.trim(), f.id);
      assert.ok(f.missing.trim(), f.id);
      assert.ok(f.layout, f.id);
      for (const n of f.nodes) {
        assert.ok(n.algorithm.trim(), n.id);
        assert.ok(["living", "partial", "missing"].includes(n.status), n.id);
        if (n.status === "missing") assert.notEqual(n.shape, "start");
      }
    }
    const stats = flowStats();
    assert.ok(stats.living >= 40, `living ${stats.living}`);
    assert.ok(stats.missing >= 4, `missing ${stats.missing}`);
    assert.equal(
      FLOWS.find((f) => f.id === "supply")?.nodes.filter((n) => n.status === "missing").map((n) => n.id).sort().join(),
      "sc-fin,sc-match,sc-proc",
    );
  });

  it("every flow walks without throwing and never writes a rupee", () => {
    for (const f of FLOWS) {
      const walk = runFlow(f.id);
      assert.equal(walk.rupee, null, f.id);
      assert.equal(walk.steps.length, f.nodes.length, f.id);
      assert.ok(walk.reason.includes("No invented"), f.id);
    }
    const all = runAllFlows();
    assert.equal(all.length, 11);
    assert.ok(all.every((w) => w.rupee === null));
  });

  it("strategy refuses loan and tourism; remaining-first holds", () => {
    const walk = runFlow("strategy");
    const loan = walk.steps.find((s) => s.nodeId === "s-loan");
    const tour = walk.steps.find((s) => s.nodeId === "s-tour");
    const remain = walk.steps.find((s) => s.nodeId === "s-remain");
    assert.equal(loan?.decision, "refuse");
    assert.equal(tour?.decision, "refuse");
    assert.equal(remain?.decision, "pass");
    assert.equal(walk.refused, 2);
  });

  it("payment firewall blocks AI rupee writes; paymentRef defers until declared; bank rails stay named", () => {
    const open = runFlow("payment");
    assert.equal(open.steps.find((s) => s.nodeId === "pay-wall")?.decision, "pass");
    assert.equal(open.steps.find((s) => s.nodeId === "pay-ref")?.decision, "defer");
    assert.equal(open.steps.find((s) => s.nodeId === "pay-bank")?.decision, "named");
    assert.equal(open.named, 1);

    const sealed = runFlow("payment", defaultFlowFacts({ rupeeWrite: true }));
    assert.equal(sealed.steps.find((s) => s.nodeId === "pay-wall")?.decision, "block");

    const paid = runFlow("payment", defaultFlowFacts({ paymentRef: "UPI-LANGTHASA-1" }));
    assert.equal(paid.steps.find((s) => s.nodeId === "pay-ref")?.decision, "pass");
    assert.equal(paid.rupee, null);
  });

  it("material conserves remaining along mint → offtake → spoilage", () => {
    const walk = runFlow(
      "material",
      defaultFlowFacts({ mintedGrams: 180000, offtakeGrams: 40000, spoilageGrams: 2000, remainingGrams: 138000 }),
    );
    const cons = walk.steps.find((s) => s.nodeId === "m-conserve");
    assert.equal(cons?.decision, "pass");
    assert.match(cons?.reason ?? "", /138000 g/);
  });

  it("process rests the mill on heat and does not freeze EMI", () => {
    const rest = runFlow("process", defaultFlowFacts({ alert: true, iotTempC: 31.4 }));
    const mill = rest.steps.find((s) => s.nodeId === "p-mill");
    assert.equal(mill?.decision, "block");
    assert.match(mill?.reason ?? "", /EMI not frozen/);
  });

  it("command constitution blocks rupee writes; companion only proposes", () => {
    const ok = runFlow("command");
    assert.equal(ok.steps.find((s) => s.nodeId === "c-human")?.decision, "pass");
    assert.equal(ok.steps.find((s) => s.nodeId === "c-law")?.decision, "pass");
    const bad = runFlow("command", defaultFlowFacts({ rupeeWrite: true }));
    assert.equal(bad.steps.find((s) => s.nodeId === "c-law")?.decision, "block");
    assert.equal(bad.steps.find((s) => s.nodeId === "c-wall")?.decision, "block");
  });

  it("coordination: unknown events fail; harvest pulse lives", () => {
    const walk = runFlow("coordination");
    assert.equal(walk.steps.find((s) => s.nodeId === "k-unk")?.decision, "pass");
    assert.match(walk.steps.find((s) => s.nodeId === "k-unk")?.reason ?? "", /Unknown events fail/);
    assert.equal(walk.steps.find((s) => s.nodeId === "k-pub")?.decision, "pass");
  });

  it("supply chain names finance, procure, and 3-way match as missing", () => {
    const walk = runFlow("supply");
    assert.equal(walk.steps.find((s) => s.nodeId === "sc-fin")?.decision, "named");
    assert.equal(walk.steps.find((s) => s.nodeId === "sc-proc")?.decision, "named");
    assert.equal(walk.steps.find((s) => s.nodeId === "sc-match")?.decision, "named");
    assert.equal(walk.steps.find((s) => s.nodeId === "sc-plot")?.decision, "pass");
    assert.ok(walk.named >= 3);
  });

  it("vision inspects a cell without a login profile", () => {
    const walk = runFlow("vision");
    assert.match(walk.steps.find((s) => s.nodeId === "v-eye")?.reason ?? "", /no login dossier/i);
    assert.equal(walk.steps.find((s) => s.nodeId === "v-login")?.decision, "named");
  });

  it("decision fans five tissues into a passport", () => {
    const walk = runFlow("decision");
    for (const id of ["d-front", "d-agent", "d-phys", "d-sec", "d-sci", "d-pass"]) {
      const step = walk.steps.find((s) => s.nodeId === id);
      assert.ok(step, id);
      assert.notEqual(step?.decision, "named", id);
    }
    const sealed = runFlow("decision", defaultFlowFacts({ rupeeWrite: true }));
    assert.equal(sealed.steps.find((s) => s.nodeId === "d-sec")?.decision, "block");
  });

  it("algorithms plate includes pledge, library, GI, FUS, hours-to-pay, scheme", () => {
    const walk = runFlow("algorithms");
    assert.equal(walk.steps.find((s) => s.nodeId === "a-pledge")?.decision, "pass");
    assert.equal(walk.steps.find((s) => s.nodeId === "a-hours")?.decision, "propose");
    assert.equal(walk.steps.find((s) => s.nodeId === "a-scheme")?.decision, "pass");
    assert.match(walk.steps.find((s) => s.nodeId === "a-scheme")?.reason ?? "", /undeclared/i);
    const pledged = runFlow("algorithms", defaultFlowFacts({ pledged: 1 }));
    assert.equal(pledged.steps.find((s) => s.nodeId === "a-pledge")?.decision, "block");
  });

  it("plot remaining-gate ignores offtake qty; pay-mass still holds the sale", () => {
    const facts = defaultFlowFacts({ remainingGrams: 10000, qtyGrams: 40000 });
    const supply = runFlow("supply", facts);
    assert.equal(supply.steps.find((s) => s.nodeId === "sc-plot")?.decision, "pass");
    const pay = runFlow("payment", facts);
    assert.equal(pay.steps.find((s) => s.nodeId === "pay-mass")?.decision, "block");
  });

  it("runNode fires a single algorithm without a rupee", () => {
    const n = runNode("algorithms", "a-rem");
    assert.equal(n.decision, "pass");
    assert.equal(n.rupee, null);
    assert.throws(() => runNode("algorithms", "nope"));
  });
});
