'use strict';
const assert = require('node:assert/strict');
const { AI_SYSTEMS } = require('../systems/catalog');
const { aiFirewall, remainingGate } = require('./algorithms');
const { lastCopilot, modulesCovered, runWorkflow } = require('./engine');
const { MODULE_RUNTIME, runtimeStats } = require('./registry');
const { WORKFLOWS } = require('./workflows');
const { proposeCompanion } = require('./companion');


describe("module OS", () => {
  it("plugs every named AI system into at least one workflow", () => {
    const ids = new Set(AI_SYSTEMS.map((s) => s.id));
    assert.equal(MODULE_RUNTIME.length, AI_SYSTEMS.length);
    for (const m of MODULE_RUNTIME) {
      assert.ok(ids.has(m.id), m.id);
      assert.ok(m.workflowIds.length >= 1, `${m.id} has no workflow`);
      assert.equal(m.rupeeWrite, false);
      assert.equal(m.plug, "living");
      assert.ok(m.layers.length >= 1);
    }
    assert.equal(modulesCovered().length, AI_SYSTEMS.length);
    assert.equal(runtimeStats().livingPlugs, AI_SYSTEMS.length);
  });

  it("every workflow step names a real module and AI never writes rupees", () => {
    const known = new Set(MODULE_RUNTIME.map((m) => m.id));
    for (const wf of WORKFLOWS) {
      assert.ok(wf.steps.length >= 3, wf.id);
      for (const step of wf.steps) {
        assert.ok(known.has(step.moduleId), `${wf.id} ${step.code} unknown ${step.moduleId}`);
        if (step.kind === "ai") assert.equal(step.rupeeWrite, false, `${wf.id}.${step.code}`);
      }
    }
  });

  it("firewall blocks an AI rupee write", () => {
    const blocked = aiFirewall({
      code: "X",
      moduleId: "agentic",
      name: "invent",
      kind: "ai",
      organ: "rupee",
      algorithm: "price-declared",
      emits: "agentic.price",
      rupeeWrite: true,
    });
    assert.equal(blocked.decision, "block");
  });

  it("harvest mint walks Magh Enghi and copilot names the godown", () => {
    const run = runWorkflow("harvest-mint", {
      lotId: "lot-chakhao-enghi",
      cellId: "c-enghi",
      variety: "Chakhao Poireiton",
      grams: 510_000,
      remainingGrams: 510_000,
      giMarker: "GI-AS-CHAKHAO",
      query: "harvest mint lot",
    });
    assert.equal(run.status, "passed");
    assert.ok(run.steps.some((s) => s.moduleId === "agentic"));
    assert.ok(run.steps.some((s) => s.moduleId === "orchestrator"));
    assert.ok(run.messages.length === run.steps.length);
    assert.match(lastCopilot(run) ?? "", /godown/i);
  });

  it("offtake without a declared price blocks, overselling remaining blocks, missing paymentRef defers", () => {
    const noPrice = runWorkflow("offtake-settle", {
      lotId: "lot-x",
      grams: 1000,
      remainingGrams: 1000,
      qtyGrams: 500,
      pricePaisePerKg: null,
    });
    assert.equal(noPrice.status, "blocked");

    const oversell = runWorkflow("offtake-settle", {
      lotId: "lot-x",
      grams: 1000,
      remainingGrams: 200,
      qtyGrams: 500,
      pricePaisePerKg: 18500,
      freightPaisePerKg: 0,
    });
    assert.equal(oversell.status, "blocked");

    const open = runWorkflow("offtake-settle", {
      lotId: "lot-chakhao-ronghang",
      cellId: "c-ronghang",
      grams: 840_000,
      remainingGrams: 440_000,
      qtyGrams: 400_000,
      pricePaisePerKg: 19200,
      freightPaisePerKg: 400,
      paymentRef: null,
    });
    assert.equal(open.status, "deferred");
    const waterfall = open.steps.find((s) => s.algorithm === "price-waterfall");
    assert.ok(waterfall);
    assert.equal(waterfall?.decision, "pass");
  });

  it("platform bus counts living plugs", () => {
    const run = runWorkflow("platform-bus", { query: "module OS" });
    assert.equal(run.status, "passed");
    const count = run.steps.find((s) => s.algorithm === "count-plugs");
    assert.equal(count?.payload.living, AI_SYSTEMS.length);
  });

  it("remaining-gate defers undeclared mass, blocks empty or oversold, never throws", () => {
    assert.equal(remainingGate({ workflowId: "x" }).decision, "defer");
    assert.equal(remainingGate({ workflowId: "x", remainingGrams: 0 }).decision, "block");
    assert.equal(remainingGate({ workflowId: "x", remainingGrams: 100, qtyGrams: 200 }).decision, "block");
    assert.equal(remainingGate({ workflowId: "x", grams: 100, remainingGrams: 150 }).decision, "block");
    assert.equal(remainingGate({ workflowId: "x", remainingGrams: 510000, qtyGrams: 0 }).decision, "pass");
  });

  it("period-close blocks unbalanced books; climate-reflex blocks the mill and names why", () => {
    const unbalanced = runWorkflow("period-close", { journalBalanced: false, clerk: "Biren" });
    assert.equal(unbalanced.status, "blocked");
    const closed = runWorkflow("period-close", { journalBalanced: true, clerk: "Biren" });
    assert.equal(closed.status, "passed");
    const noClerk = runWorkflow("period-close", { journalBalanced: true, clerk: " " });
    assert.equal(noClerk.status, "blocked");

    const mill = runWorkflow("climate-reflex", {
      status: "outage",
      alert: true,
      iotTempC: 31.4,
      remainingGrams: 180000,
    });
    assert.equal(mill.status, "blocked");
    const energy = mill.steps.find((s) => s.algorithm === "energy-cloud");
    assert.equal(energy?.decision, "block");
    assert.match(energy?.reason ?? "", /outage/);
    assert.ok(!mill.steps.some((s) => s.algorithm === "remaining-gate"), "remaining must not move after mill block");

    const quiet = runWorkflow("climate-reflex", { remainingGrams: 180000, iotTempC: 22 });
    assert.notEqual(quiet.status, "blocked");
  });
});

describe("agentic companion", () => {
  it("proposes settle, inward, and harvest from Magh books without writing rupees", () => {
    const books = {
      fpo: { id: "f", name: "H", village: "Langthasa", district: "KA", splitRule: "qty_weighted" },
      kpis: {
        cells: 4, lots: 2, kgInWarehouse: 0, kgMinted: 1, kgRemaining: 1,
        openPaise: 1, settledPaise: 1, farmgatePaise: 1, pendingPayouts: 0,
        avgHoursToPay: 18, journalBalanced: true, villageTcoPaise: 0, spoilageGrams: 0, giMinted: 0, integrityNote: "",
      },
      cells: [
        { id: "c-kramsapi", name: "Serdihun Kramsapi", household: "Kramsapi house · 3", fpoId: "f", village: "L", acresCenti: 120, notes: "", lotCount: 0, kgOnBooks: 0, remainingGrams: 0, rupeeCreditPaise: 0, rupeeDebitPaise: 0 },
      ],
      lots: [
        { id: "lot-ginger-teron", cellId: "c-teron", cellName: "Jirsong Teron", fpoId: "f", variety: "Nadia ginger", commodity: "ginger", grams: 220000, remainingGrams: 220000, grade: "A", giMarker: null, moistureBp: null, status: "minted", coverStatus: "gap", policyId: null, plantingId: null, giMinted: false, mintedAt: "", fusScore: 63, fusComplete: false },
      ],
      receipts: [],
      orders: [
        { id: "ord-ronghang-01", lotId: "lot-chakhao-ronghang", poolId: null, variety: "Chakhao Poireiton", cellName: "Biren Ronghang", buyer: "Diphu mill offtake", qtyGrams: 400000, pricePaisePerKg: 19200, freightPaisePerKg: 400, status: "open", hoursToPay: null, paymentRef: null, createdAt: "", settledAt: null },
        { id: "ord-enghi-01", lotId: "lot-chakhao-enghi", poolId: null, variety: "Chakhao Poireiton", cellName: "Kajir Enghi", buyer: "Guwahati GI desk", qtyGrams: 510000, pricePaisePerKg: 18500, freightPaisePerKg: 400, status: "settled", hoursToPay: 18, paymentRef: "UPI-KA-8841", createdAt: "", settledAt: "2026-01-18" },
      ],
      journal: [],
      inputs: [],
      payouts: [],
      poolable: [],
      kitchen: [],
      contracts: [],
      plantings: [],
      giChain: [],
      villageLedger: [],
      herd: [],
      weatherAlerts: [],
      energyWindows: [],
      iotReadings: [],
      schemes: [],
      fus: [],
    };
    const reading = proposeCompanion(books);
    assert.match(reading.memory, /UPI-KA-8841/);
    assert.equal(reading.firewall, "AI cannot write rupees");
    const actions = reading.proposals.map((p) => p.action);
    assert.ok(actions.includes("settle"));
    assert.ok(actions.includes("intake"));
    assert.ok(actions.includes("harvest"));
    assert.equal(reading.proposals.find((p) => p.action === "settle")?.orderId, "ord-ronghang-01");
    assert.ok(reading.proposals.every((p) => !/₹|paise\/kg|invent/i.test(p.title)));
    assert.equal(reading.proposals.find((p) => p.action === "settle")?.moduleId, "agentic");
    assert.ok(reading.proposals.some((p) => p.moduleId === "erp-agents"));
    assert.equal(reading.passport.rupeeWrite, false);
    assert.equal(reading.passport.decision, "propose");
    assert.equal(reading.passport.amountPaise, null);
    assert.equal(reading.passport.clerkRequired, true);
  });
});
