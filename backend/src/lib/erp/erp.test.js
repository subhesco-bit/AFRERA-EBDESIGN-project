'use strict';
const assert = require('node:assert/strict');
const { gramsFromKg, paiseFromKgPrice, formatKg, formatRupee, parseKg, parseRupeePerKg } = require('./money');
const { allocateFifo, assertCanSell, inputJournal, journalBalances, parseAcresCenti, remainingAfterCommit, settlementAmounts, settlementJournal, splitQtyWeighted, evaluateCover, kitchenImplies, offerNextSeason, LANGTHASA_MASTER_POLICY, LANGTHASA_WEATHER_POLICY, LANGTHASA_HERD_POLICY, NEXT_SEASON, remainingAfterSpoilage, mintGiBirth, assertGiClaim, villageSpoilagePost, declaredCostPerKg, weightedAverageCostPaisePerKg, intakeWac, issueAtWac, foodUtilityScore, fusForVariety, evaluateWeatherCover, evaluateHerdCover, weatherReflex, energyProcessGate, millDecision, schemeEligible, assertDeclaredReading } = require('./kernel');
const { exceptions, fpoPnl, processMass, trialBalance } = require('./platform');
const { ERP_MODULES, atlasScore, manageErpModule, nestedRemaining, stakeholderMayWrite } = require('./atlas');

describe("three stalls", () => {
  it("binds Langthasa godown cover without inventing a premium", () => {
    const v = evaluateCover("Langthasa godown");
    assert.equal(v.status, "bound");
    assert.equal(v.policyId, LANGTHASA_MASTER_POLICY);
    assert.equal(evaluateCover("unknown shed").status, "gap");
  });
  it("kitchen implies Chakhao pithas to Chakhao Poireiton", () => {
    const hits = kitchenImplies(
      [{ dish: "Chakhao pithas", variety: "Chakhao Poireiton", festival: "Magh" }],
      "Chakhao Poireiton",
    );
    assert.equal(hits[0]?.dish, "Chakhao pithas");
  });
  it("offers next Magh at settled kilograms with a blank price", () => {
    const o = offerNextSeason(510000);
    assert.equal(o.season, NEXT_SEASON);
    assert.equal(o.qtyGrams, 510000);
    assert.equal(o.pricePaisePerKg, null);
  });
});

describe("pulse remainder", () => {
  it("mints a GI birth only when a marker exists, and blocks a GI claim without it", () => {
    assert.equal(mintGiBirth({ giMarker: null, handler: "Biren Ronghang", geo: "Langthasa, Karbi Anglong", season: "Magh 2026" }), null);
    const birth = mintGiBirth({
      giMarker: "GI-AS-CHAKHAO",
      handler: "Biren Ronghang",
      geo: "Langthasa, Karbi Anglong",
      season: "Magh 2026",
    });
    assert.equal(birth?.event, "mint");
    assert.equal(birth?.handler, "Biren Ronghang");
    assert.doesNotThrow(() => assertGiClaim("GI-AS-CHAKHAO", 1));
    assert.throws(() => assertGiClaim("GI-AS-CHAKHAO", 0));
    assert.doesNotThrow(() => assertGiClaim(null, 0));
  });

  it("cuts remaining grams on declared spoilage and posts village fever without inventing ₹", () => {
    assert.equal(remainingAfterSpoilage(220000, 40000), 180000);
    assert.throws(() => remainingAfterSpoilage(220000, 0));
    assert.throws(() => remainingAfterSpoilage(220000, 300000));
    const post = villageSpoilagePost(40000, 0, "power cut");
    assert.equal(post.organId, "rcop");
    assert.equal(post.amountPaise, 0);
    assert.equal(post.qtyGrams, 40000);
    assert.equal(declaredCostPerKg(68800, 840000), 82);
    assert.equal(declaredCostPerKg(0, 840000), null);
  });
});

describe("named remainder", () => {
  it("scores FUS-v1 on declared food axes and never invents affordability", () => {
    const chakhao = fusForVariety("Chakhao Poireiton");
    assert.ok(chakhao);
    assert.equal(chakhao.complete, false);
    assert.equal(chakhao.version, "FUS-v1");
    assert.equal(chakhao.score, Math.round((78 + 72 + 84 + 94 + 42) / 5));
    assert.equal(fusForVariety("unknown millet"), null);
    const withRupee = foodUtilityScore({
      nutrition: 78, satiety: 72, taste: 84, culture: 94, convenience: 42, affordability: 50,
    });
    assert.equal(withRupee.complete, true);
    assert.throws(() => foodUtilityScore({ nutrition: 101, satiety: 0, taste: 0, culture: 0, convenience: 0, affordability: null }));
  });

  it("binds weather and herd cover without inventing a premium", () => {
    const w = evaluateWeatherCover("Langthasa");
    assert.equal(w.status, "bound");
    assert.equal(w.policyId, LANGTHASA_WEATHER_POLICY);
    assert.equal(evaluateWeatherCover("unknown village").status, "gap");
    const h = evaluateHerdCover(2);
    assert.equal(h.status, "bound");
    assert.equal(h.policyId, LANGTHASA_HERD_POLICY);
    assert.equal(evaluateHerdCover(0).status, "gap");
  });

  it("opens a weather claim window and refuses to freeze EMI", () => {
    const r = weatherReflex("unseasonal Magh rain");
    assert.equal(r.claimWindow, true);
    assert.equal(r.freezeEmi, false);
    assert.equal(r.moratorium, "propose");
    assert.throws(() => weatherReflex("  "));
  });

  it("blocks the mill on an active outage and leaves kWh undeclared", () => {
    assert.equal(energyProcessGate({ status: "outage", kwh: null, active: true }).decision, "block");
    assert.equal(energyProcessGate({ status: "ok", kwh: null, active: true }).decision, "defer");
    assert.equal(energyProcessGate({ status: "ok", kwh: 40, active: true }).decision, "pass");
    const mill = millDecision({ outage: true, alert: true, iotTempC: 31.4, kwh: null });
    assert.equal(mill.decision, "block");
    assert.deepEqual([...mill.signals].sort(), ["alert", "heat", "outage"]);
    assert.equal(millDecision({ outage: false, alert: false, iotTempC: 22, kwh: null }).decision, "defer");
    assert.equal(millDecision({ outage: false, alert: false, iotTempC: 22, kwh: 12 }).decision, "pass");
  });

  it("computes scheme eligibility with a blank rupee", () => {
    const kisan = schemeEligible("PM-KISAN", { acresCenti: 240, plantingCount: 1, horticulture: false });
    assert.equal(kisan.eligible, true);
    assert.equal(kisan.amountPaise, null);
    const midh = schemeEligible("MIDH", { acresCenti: 180, plantingCount: 1, horticulture: true });
    assert.equal(midh.eligible, true);
    const none = schemeEligible("PMFBY", { acresCenti: 120, plantingCount: 0, horticulture: false });
    assert.equal(none.eligible, false);
    const green = schemeEligible("OP-GREEN", {
      acresCenti: 180,
      plantingCount: 1,
      horticulture: true,
      fpo: true,
      perishable: true,
    });
    assert.equal(green.eligible, true);
    assert.equal(green.amountPaise, null);
    const ne = schemeEligible("NE-LOGISTICS", {
      acresCenti: 180,
      plantingCount: 1,
      horticulture: false,
      northEast: true,
      freightDeclared: true,
    });
    assert.equal(ne.eligible, true);
    assert.equal(ne.amountPaise, null);
  });

  it("refuses an undeclared IoT reading", () => {
    assert.doesNotThrow(() => assertDeclaredReading({ entityId: "Langthasa godown", kind: "temperature", value: 31.4, unit: "C" }));
    assert.throws(() => assertDeclaredReading({ entityId: "", kind: "temperature", value: 31.4, unit: "C" }));
    assert.throws(() => assertDeclaredReading({ entityId: "godown", kind: "temperature", value: Number.NaN, unit: "C" }));
  });
});

describe("rural ERP money", () => {
  it("keeps mass in grams and money in paise", () => {
    assert.equal(gramsFromKg(840), 840000);
    assert.equal(paiseFromKgPrice(840000, 18500), 15540000);
    assert.equal(formatKg(840000), "840 kg");
    assert.match(formatRupee(15540000), /1,55,400/);
  });

  it("refuses empty or invented prices", () => {
    assert.equal(parseKg(""), null);
    assert.equal(parseKg("0"), null);
    assert.equal(parseRupeePerKg(""), null);
    assert.equal(parseRupeePerKg("0"), null);
    assert.equal(parseRupeePerKg("192"), 19200);
    assert.equal(parseKg("400"), 400000);
  });
});

describe("rural ERP kernel", () => {
  it("keeps remaining mass on the same lot body", () => {
    assert.equal(remainingAfterCommit(840000, 400000), 440000);
    assert.throws(() => remainingAfterCommit(510000, 600000));
  });

  it("refuses pledged or settled stock", () => {
    assert.throws(() => assertCanSell("pledged", 0));
    assert.throws(() => assertCanSell("in_warehouse", 1));
    assert.throws(() => assertCanSell("settled", 0));
    assert.doesNotThrow(() => assertCanSell("in_warehouse", 0));
    assert.doesNotThrow(() => assertCanSell("minted", 0));
  });

  it("posts a balanced settlement: cash in, farmgate + freight out", () => {
    const amounts = settlementAmounts(510000, 18500, 400);
    assert.equal(amounts.gross, 9435000);
    assert.equal(amounts.freight, 204000);
    assert.equal(amounts.farmgate, 9231000);
    const lines = settlementJournal({ variety: "Chakhao Poireiton", hoursToPay: 18, ...amounts });
    assert.equal(journalBalances(lines), true);
    assert.equal(
      lines.find((l) => l.account === "cash")?.side,
      "debit",
    );
  });

  it("posts a balanced input cost", () => {
    const lines = inputJournal("energy", 68800, "Drying hours, declared", "recie");
    assert.equal(journalBalances(lines), true);
  });

  it("allocates collective offtake FIFO and splits farmgate qty-weighted", () => {
    const take = allocateFifo(
      [
        { id: "a", remainingGrams: 400000 },
        { id: "b", remainingGrams: 440000 },
      ],
      600000,
    );
    assert.deepEqual(take, [
      { lotId: "a", qtyGrams: 400000 },
      { lotId: "b", qtyGrams: 200000 },
    ]);
    assert.throws(() => allocateFifo([{ id: "a", remainingGrams: 100 }], 200));

    const split = splitQtyWeighted(
      [
        { cellId: "c-enghi", qtyGrams: 510000 },
        { cellId: "c-ronghang", qtyGrams: 400000 },
      ],
      9231000,
    );
    const sum = split.reduce((n, s) => n + s.amountPaise, 0);
    assert.equal(sum, 9231000);
    assert.ok(split[0].amountPaise > split[1].amountPaise);
  });

  it("blends declared cost as WAC and issues FIFO mass at that average", () => {
    const wac = weightedAverageCostPaisePerKg([
      { id: "a", remainingGrams: 400000, costPaise: 7_400_000 },
      { id: "b", remainingGrams: 600000, costPaise: 9_000_000 },
    ]);
    // (74000 + 90000) rupees / 1000 kg = ₹164/kg = 16400 paise/kg
    assert.equal(wac, 16400);
    assert.throws(() => weightedAverageCostPaisePerKg([]));
    assert.throws(() =>
      weightedAverageCostPaisePerKg([{ id: "a", remainingGrams: 0, costPaise: 100 }]),
    );

    const blended = intakeWac(400000, 7_400_000, 600000, 9_000_000);
    assert.equal(blended.remainingGrams, 1_000_000);
    assert.equal(blended.costPaise, 16_400_000);
    assert.equal(blended.wacPaisePerKg, 16400);

    const issued = issueAtWac(
      [
        { id: "a", remainingGrams: 400000, costPaise: 7_400_000 },
        { id: "b", remainingGrams: 600000, costPaise: 9_000_000 },
      ],
      500000,
    );
    assert.equal(issued.wacPaisePerKg, 16400);
    assert.equal(issued.issuedCostPaise, paiseFromKgPrice(500000, 16400));
    assert.equal(
      issued.take.reduce((n, t) => n + t.costPaise, 0),
      issued.issuedCostPaise,
    );
    assert.deepEqual(
      issued.take.map((t) => ({ lotId: t.lotId, qtyGrams: t.qtyGrams })),
      [
        { lotId: "a", qtyGrams: 400000 },
        { lotId: "b", qtyGrams: 100000 },
      ],
    );
  });

  it("parses acres as centi-acres", () => {
    assert.equal(parseAcresCenti("2.4"), 240);
    assert.equal(parseAcresCenti("0"), null);
  });
});

describe("rural ERP platform", () => {
  it("turns remaining mass into saleable by a declared loss", () => {
    assert.equal(processMass(440000, 14000).saleableGrams, 426000);
    assert.throws(() => processMass(1000, 2000));
  });

  it("builds a trial balance and names open offtake as a deferred gate", () => {
    const journal = [
      { id: 1, entryId: "je", cellId: "c", lotId: "l", organId: "rupee", account: "cash", side: "debit", amountPaise: 100, memo: "m", createdAt: "" },
      { id: 2, entryId: "je", cellId: "c", lotId: "l", organId: "rupee", account: "farmgate", side: "credit", amountPaise: 90, memo: "m", createdAt: "" },
      { id: 3, entryId: "je", cellId: "c", lotId: "l", organId: "logistics", account: "freight", side: "credit", amountPaise: 10, memo: "m", createdAt: "" },
    ];
    const tb = trialBalance(journal);
    assert.equal(tb.find((a) => a.account === "cash")?.debitPaise, 100);
    const pnl = fpoPnl(journal, [{ id: 1, cellId: "c", cellName: "n", kind: "energy", qty: 1, unit: "kWh", amountPaise: 20, memo: "m", createdAt: "" }]);
    assert.equal(pnl.grossPaise, 100);
    assert.equal(pnl.netToCellsPaise, 70);
    const gates = exceptions({
      journalBalanced: true,
      lots: [],
      receipts: [],
      orders: [{ id: "o", lotId: "l", poolId: null, variety: "v", cellName: "n", buyer: "b", qtyGrams: 1, pricePaisePerKg: 1, freightPaisePerKg: 0, status: "open", hoursToPay: null, paymentRef: null, createdAt: "", settledAt: null }],
      payouts: [],
    });
    assert.ok(gates.some((g) => g.code === "G2"));
  });
});

describe("rural ERP atlas", () => {
  it("classifies every analog family without claiming SAP parity", () => {
    const score = atlasScore();
    assert.equal(ERP_MODULES.length, 32);
    assert.equal(score.modules, 32);
    assert.equal(score.living, 7);
    assert.equal(score.partial, 11);
    assert.equal(score.missing, 9);
    assert.equal(score.refused, 5);
    assert.equal(score.classifiedPct, 100);
    assert.equal(score.sapParity, false);
    assert.equal(score.financeMissing, true);
    assert.equal(score.procureMissing, true);
    assert.equal(score.githubPct, 7);
    assert.equal(score.latticePct, 39);
    const ids = ERP_MODULES.map((m) => m.id);
    assert.equal(ids.length, new Set(ids).size);
  });

  it("conserves nested remaining person = home = village", () => {
    const nested = nestedRemaining(
      [
        { id: "c1", name: "Enghi", household: "H1", remainingGrams: 100000 },
        { id: "c2", name: "Langthasa", household: "H1", remainingGrams: 80000 },
        { id: "c3", name: "Other", household: "H2", remainingGrams: 20000 },
      ],
      [{ variety: "Chakhao Poireiton", remainingGrams: 50000 }],
      [{ dish: "Chakhao pithas", variety: "Chakhao Poireiton", festival: "Magh" }],
    );
    assert.equal(nested.person.length, 3);
    assert.equal(nested.home.length, 2);
    assert.equal(nested.village.remainingGrams, 200000);
    assert.equal(nested.village.cellCount, 3);
    assert.equal(nested.village.homeCount, 2);
    const homeSum = nested.home.reduce((n, h) => n + h.remainingGrams, 0);
    const personSum = nested.person.reduce((n, p) => n + p.remainingGrams, 0);
    assert.equal(homeSum, personSum);
    assert.equal(homeSum, nested.village.remainingGrams);
    assert.equal(nested.conserved, true);
    assert.equal(nested.kitchenBoundGrams, 50000);
    const empty = nestedRemaining([]);
    assert.equal(empty.conserved, true);
    assert.equal(empty.village.remainingGrams, 0);
  });

  it("refuses banker and dealer writes; clerk may declare rupees", () => {
    assert.equal(stakeholderMayWrite("banker", "rupee").allowed, false);
    assert.equal(stakeholderMayWrite("banker", "remaining").allowed, false);
    assert.equal(stakeholderMayWrite("dealer", "remaining").allowed, false);
    assert.equal(stakeholderMayWrite("dealer", "rupee").allowed, false);
    assert.match(stakeholderMayWrite("banker", "rupee").reason, /finance stays missing/i);
    assert.match(stakeholderMayWrite("dealer", "remaining").reason, /procure stays missing/i);
    assert.equal(stakeholderMayWrite("clerk", "rupee").allowed, true);
    assert.equal(stakeholderMayWrite("farmer", "remaining").allowed, true);
    assert.equal(stakeholderMayWrite("companion", "propose").allowed, true);
    assert.equal(stakeholderMayWrite("brain", "rupee").allowed, false);
    assert.equal(stakeholderMayWrite("brain", "propose").allowed, true);
    assert.equal(stakeholderMayWrite("vet", "propose").allowed, true);
    assert.equal(stakeholderMayWrite("vet", "rupee").allowed, false);
  });

  it("names finance and procure missing and refuses tourism, CFD, AI rupee", () => {
    const ap = manageErpModule("fi-ap");
    assert.equal(ap.decision, "named");
    assert.equal(ap.status, "missing");
    assert.equal(ap.rupeeWrite, false);
    assert.match(ap.reason, /named missing/i);
    const pur = manageErpModule("mm-pur");
    assert.equal(pur.decision, "named");
    assert.match(pur.reason, /Purchasing/i);
    const ar = manageErpModule("fi-ar");
    assert.equal(ar.decision, "named");
    const bl = manageErpModule("fi-bl");
    assert.equal(bl.decision, "named");
    const tour = manageErpModule("sd-tour");
    assert.equal(tour.decision, "refuse");
    assert.match(tour.reason, /Tourism/i);
    const cfd = manageErpModule("eng-cfd");
    assert.equal(cfd.decision, "refuse");
    assert.match(cfd.reason, /CFD/i);
    const ai = manageErpModule("ai-rupee");
    assert.equal(ai.decision, "refuse");
    assert.equal(ai.rupeeWrite, false);
    assert.equal(ai.amountPaise, null);
    const unknown = manageErpModule("sap-xyz");
    assert.equal(unknown.decision, "named");
  });
});
