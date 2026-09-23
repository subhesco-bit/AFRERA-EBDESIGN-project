'use strict';
const assert = require('node:assert/strict');
const { AI_UNITS, BRAIN_SIGNALS, TISSUES, ackAi, ackAllAi, aiScore, brainDecide } = require('./index');
const { AI_SYSTEMS } = require('../systems/catalog');

const base = {
  remainingGrams: 180000,
  outage: false,
  alert: false,
  iotTempC: null,
  balanced: true,
  clerk: "Biren",
};

describe("village brain", () => {
  it("names five tissues and twelve signals", () => {
    assert.equal(TISSUES.length, 5);
    assert.deepEqual(
      TISSUES.map((t) => t.id),
      ["frontier", "agentic", "physical", "security", "scientist"],
    );
    assert.equal(BRAIN_SIGNALS.length, 12);
  });

  it("blocks mill heat, never freezes EMI, never writes a rupee", () => {
    const p = brainDecide({
      ...base,
      signal: "mill-heat",
      outage: true,
      alert: true,
      iotTempC: 31.4,
    });
    assert.equal(p.decision, "block");
    assert.equal(p.rupeeWrite, false);
    assert.equal(p.amountPaise, null);
    assert.equal(p.humanoid, false);
    assert.ok(p.tissues.find((t) => t.id === "frontier")?.fired);
    assert.match(p.reason, /Mill blocked/);
  });

  it("defers mill clear until kWh is declared, then passes", () => {
    const deferred = brainDecide({ ...base, signal: "mill-clear" });
    assert.equal(deferred.decision, "defer");
    assert.equal(deferred.tissues.find((t) => t.id === "frontier")?.verdict, "defer");
    assert.equal(deferred.tissues.find((t) => t.id === "physical")?.verdict, "defer");
    const clear = brainDecide({ ...base, signal: "mill-clear", kwh: 12 });
    assert.equal(clear.decision, "pass");
    assert.equal(clear.rupeeWrite, false);
    assert.equal(clear.tissues.find((t) => t.id === "physical")?.verdict, "pass");
  });

  it("refuses tourism and humanoid teleop; loan stays refused", () => {
    assert.equal(brainDecide({ ...base, signal: "tourism" }).decision, "block");
    assert.equal(brainDecide({ ...base, signal: "physical-teleop" }).humanoid, false);
    assert.equal(brainDecide({ ...base, signal: "physical-teleop" }).decision, "block");
    assert.equal(brainDecide({ ...base, signal: "loan" }).decision, "block");
    assert.match(brainDecide({ ...base, signal: "loan" }).reason, /underwriting/);
  });

  it("hypothesizes remaining after declared loss; yield stays null", () => {
    const p = brainDecide({ ...base, signal: "hypothesis", lossPctDeclared: 10 });
    assert.equal(p.decision, "pass");
    assert.equal(p.yield, null);
    assert.equal(p.amountPaise, null);
    const sci = p.tissues.find((t) => t.id === "scientist");
    assert.equal(sci?.verdict, "hypothesis");
    assert.match(sci?.reason ?? "", /162000/);
  });

  it("agentic harvest is propose-only; security always fires", () => {
    const p = brainDecide({ ...base, signal: "harvest-propose" });
    assert.equal(p.decision, "propose");
    assert.equal(p.clerkRequired, true);
    assert.equal(p.tissues.find((t) => t.id === "security")?.fired, true);
    assert.equal(brainDecide({ ...base, signal: "rupee-write", rupeeWrite: true }).decision, "block");
  });

  it("empty remaining blocks the frontier", () => {
    const p = brainDecide({ ...base, signal: "remaining", remainingGrams: 0 });
    assert.equal(p.decision, "block");
    assert.equal(p.tissues.find((t) => t.id === "frontier")?.verdict, "block");
  });

  it("every named signal decides without writing a rupee", () => {
    for (const s of BRAIN_SIGNALS) {
      const p = brainDecide({
        ...base,
        signal: s.id,
        outage: s.id === "mill-heat",
        alert: s.id === "mill-heat",
        iotTempC: s.id === "mill-heat" ? 31.4 : null,
        kwh: s.id === "mill-clear" ? 12 : null,
        balanced: s.id !== "period",
        rupeeWrite: s.id === "rupee-write",
      });
      assert.equal(p.rupeeWrite, false, s.id);
      assert.equal(p.amountPaise, null, s.id);
      assert.equal(p.yield, null, s.id);
      assert.equal(p.humanoid, false, s.id);
      assert.ok(p.tissues.some((t) => t.fired), s.id);
    }
  });
});

describe("AI atlas", () => {
  it("classifies every analog family without claiming AI parity", () => {
    const score = aiScore();
    assert.equal(AI_UNITS.length, 35);
    assert.equal(score.units, 35);
    assert.equal(score.living, 9);
    assert.equal(score.partial, 11);
    assert.equal(score.missing, 10);
    assert.equal(score.refused, 5);
    assert.equal(score.classifiedPct, 100);
    assert.equal(score.aiParity, false);
    assert.equal(score.decisionCapable, true);
    assert.equal(score.rupeeWrite, false);
    assert.equal(score.githubLivingPlugs, 0);
    assert.equal(score.githubCadavers, AI_SYSTEMS.length);
    assert.equal(score.latticeTissues, 5);
    assert.equal(score.signals, 12);
    assert.equal(score.financeMissing, true);
    assert.equal(score.procureMissing, true);
    assert.equal(score.githubPct, 7);
    assert.equal(score.latticePct, 39);
    const ids = AI_UNITS.map((m) => m.id);
    assert.equal(ids.length, new Set(ids).size);
  });

  it("acks living tissues with a passport and never writes rupees", () => {
    const all = ackAllAi({ remainingGrams: 180000, kwh: 12 });
    assert.equal(all.classified, 100);
    assert.equal(all.rupeeWrites, 0);
    assert.equal(all.livingPassports, 9);
    assert.equal(all.named, 10);
    assert.equal(all.refused, 5);
    assert.equal(all.unknownNamed, true);
    assert.ok(all.results.every((r) => r.rupeeWrite === false));
    assert.ok(all.results.every((r) => r.amountPaise === null));
    assert.ok(all.results.every((r) => r.humanoid === false));
    const agentic = ackAi("agentic");
    assert.equal(agentic.decision, "propose");
    assert.equal(agentic.clerkRequired, true);
    assert.equal(agentic.passport?.signal, "harvest-propose");
    const cortex = ackAi("cortex", { remainingGrams: 180000 });
    assert.equal(cortex.decision, "pass");
    assert.ok(cortex.passport);
  });

  it("names finance and procure AI missing and refuses tourism, humanoid, rupee write", () => {
    const fin = ackAi("finance-ai");
    assert.equal(fin.decision, "named");
    assert.equal(fin.status, "missing");
    assert.match(fin.reason, /named missing/i);
    const pur = ackAi("procure-ai");
    assert.equal(pur.decision, "named");
    const ocr = ackAi("ocr");
    assert.equal(ocr.decision, "named");
    const tour = ackAi("tourism-ai");
    assert.equal(tour.decision, "refuse");
    assert.match(tour.reason, /Tourism/i);
    const bot = ackAi("humanoid-teleop");
    assert.equal(bot.decision, "refuse");
    assert.equal(bot.humanoid, false);
    const rupee = ackAi("ai-rupee");
    assert.equal(rupee.decision, "refuse");
    assert.equal(rupee.rupeeWrite, false);
    assert.equal(rupee.amountPaise, null);
    const yieldF = ackAi("yield-forecast");
    assert.equal(yieldF.decision, "refuse");
    assert.equal(yieldF.yield, null);
    assert.equal(ackAi("not-a-real-ai").decision, "named");
    const vet = ackAi("vet-coding");
    assert.equal(vet.status, "living");
    assert.equal(vet.decision, "propose");
    assert.equal(vet.clerkRequired, true);
    assert.equal(vet.passport?.signal, "vet-code");
    assert.equal(vet.rupeeWrite, false);
    const cadaver = ackAi("github-medical");
    assert.equal(cadaver.decision, "named");
    assert.equal(cadaver.status, "missing");
    assert.match(cadaver.reason, /named missing/i);
    const share = ackAi("share-slot");
    assert.equal(share.status, "living");
    assert.equal(share.decision, "propose");
    assert.equal(share.clerkRequired, true);
    assert.equal(share.passport?.signal, "share-slot");
    assert.equal(share.rupeeWrite, false);
  });
});
