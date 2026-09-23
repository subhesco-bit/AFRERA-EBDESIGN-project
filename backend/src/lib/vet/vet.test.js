'use strict';
const assert = require('node:assert/strict');

const { CODE_SYSTEMS, SPECIES, VET_CODES, codesForSpecies, confirmVet, giLotLineage, herdCellLineage, isHumanGenome, nestedLineage, proposeVet, repairLineages, repairedGiPath } = require('./index');

function lot(partial) {
  return {
    cellId: "c-ronghang",
    cellName: "Biren Ronghang",
    fpoId: "f1",
    variety: "Chakhao Poireiton",
    commodity: "rice",
    grams: 180000,
    remainingGrams: 180000,
    grade: null,
    giMarker: "GI-AS-CHAKHAO",
    moistureBp: null,
    status: "minted",
    coverStatus: "bound",
    policyId: "POL-LANGTHASA-GODOWN",
    plantingId: null,
    giMinted: true,
    mintedAt: "2026-01-01",
    fusScore: 74,
    fusComplete: false,
    ...partial,
  };
}

describe("AFRERA-VET August AI", () => {
  it("names nine village species and refuses GitHub human ICD", () => {
    assert.equal(SPECIES.length, 9);
    assert.deepEqual(
      SPECIES.map((s) => s.id),
      ["cattle", "buffalo", "goat", "pig", "poultry", "duck", "fish", "dog", "cat"],
    );
    assert.equal(VET_CODES.length, 19);
    assert.ok(codesForSpecies("cattle").length >= 4);
    assert.ok(codesForSpecies("fish").some((c) => c.id === "AV-PIS-O2"));
    assert.ok(codesForSpecies("dog").some((c) => c.id === "AV-CAN-RAB"));
    const systems = Object.fromEntries(CODE_SYSTEMS.map((s) => [s.id, s.status]));
    assert.equal(systems["afrera-vet"], "living");
    assert.equal(systems["icd11-vet-analog"], "partial");
    assert.equal(systems["snomed-vet-analog"], "missing");
    assert.equal(systems["github-human-icd"], "refused");
  });

  it("proposes mastitis on cattle and never writes a rupee", () => {
    const p = proposeVet({ species: "cattle", signs: ["hot-udder", "clotted-milk"] });
    assert.equal(p.decision, "propose");
    assert.equal(p.code?.id, "AV-BOV-MAS");
    assert.equal(p.clerkRequired, true);
    assert.equal(p.rupeeWrite, false);
    assert.equal(p.amountPaise, null);
    assert.equal(p.yield, null);
    assert.equal(p.freezeEmi, false);
    const ok = confirmVet({ species: "cattle", codeId: "AV-BOV-MAS", heads: 2, remainingHeads: 2 });
    assert.equal(ok.decision, "pass");
    assert.equal(ok.rupee, null);
    assert.equal(ok.freezeEmi, false);
    assert.equal(ok.moved, false);
    assert.equal(ok.remainingHeads, 2);
  });

  it("names ASF and avian influenza; does not auto-confirm", () => {
    const asf = proposeVet({ species: "pig", signs: ["fever", "blotching"] });
    assert.equal(asf.decision, "named");
    assert.equal(asf.code?.id, "AV-SUI-ASF");
    assert.equal(confirmVet({ species: "pig", codeId: "AV-SUI-ASF", heads: 4, remainingHeads: 4 }).decision, "block");
    const ai = proposeVet({ species: "poultry", signs: ["sudden-death", "swollen-comb"] });
    assert.equal(ai.decision, "named");
    assert.equal(ai.code?.id, "AV-AVI-AI");
    assert.equal(confirmVet({ species: "poultry", codeId: "AV-AVI-AI", heads: 12, remainingHeads: 12 }).decision, "block");
  });

  it("refuses diabetes and ICD-10 as the wrong genome", () => {
    assert.equal(isHumanGenome("ICD-10 E11.9 diabetes"), true);
    const d = proposeVet({ species: "cattle", signs: ["thin"], note: "diabetes E11.9" });
    assert.equal(d.decision, "refuse");
    assert.match(d.reason, /wrong genome/i);
    const icd = proposeVet({ species: "human", signs: ["fever"], note: "ICD-10 hospital coding" });
    assert.equal(icd.decision, "refuse");
    assert.equal(confirmVet({ species: "cattle", codeId: "E11.9", heads: 1, remainingHeads: 1 }).decision, "block");
  });

  it("conserves headcount; remaining cannot grow; EMI not frozen", () => {
    const grow = confirmVet({ species: "goat", codeId: "AV-CAP-MAS", heads: 4, remainingHeads: 5 });
    assert.equal(grow.decision, "block");
    assert.match(grow.reason, /cannot exceed/);
    const cut = confirmVet({ species: "goat", codeId: "AV-CAP-MAS", heads: 4, remainingHeads: 3 });
    assert.equal(cut.decision, "pass");
    assert.equal(cut.remainingHeads, 3);
    assert.equal(cut.freezeEmi, false);
    const wrong = confirmVet({ species: "fish", codeId: "AV-BOV-MAS", heads: 1, remainingHeads: 1 });
    assert.equal(wrong.decision, "block");
  });

  it("codes pets, fish, poultry, dairy, goat, pigs as living or named", () => {
    assert.equal(proposeVet({ species: "dog", signs: ["bite-risk"] }).code?.id, "AV-CAN-RAB");
    assert.equal(proposeVet({ species: "cat", signs: ["sneezing"] }).decision, "defer");
    assert.equal(proposeVet({ species: "fish", signs: ["gasping", "surface-piping"] }).code?.id, "AV-PIS-O2");
    assert.equal(proposeVet({ species: "poultry", signs: ["bloody-droppings"] }).code?.id, "AV-AVI-COCC");
    assert.equal(proposeVet({ species: "buffalo", signs: ["hot-udder"] }).code?.id, "AV-BOV-MAS");
    assert.equal(proposeVet({ species: "goat", signs: ["fever", "discharge"] }).code?.id, "AV-CAP-PPR");
    assert.equal(proposeVet({ species: "pig", signs: ["thin", "scours"] }).code?.id, "AV-BOV-WORM");
  });
});

describe("token and remaining lineage", () => {
  it("conserves a GI mint path and names a broken token", () => {
    const minted = lot({ id: "lot-ok" });
    const chain = [
      { id: "g1", lotId: "lot-ok", seq: 1, event: "mint", handler: "Biren", geo: "Langthasa", season: "Magh 2026", createdAt: "2026-01-01" },
    ];
    const ok = giLotLineage(minted, chain);
    assert.equal(ok.conserved, true);
    assert.deepEqual(ok.path, ["mint"]);
    assert.equal(ok.rupee, null);

    const broken = giLotLineage(lot({ id: "lot-hot", remainingGrams: 200000 }), chain);
    assert.equal(broken.conserved, false);
    assert.ok(broken.broken.some((b) => /exceeds/.test(b)));

    const skip = giLotLineage(lot({ id: "lot-skip", status: "in_warehouse" }), [
      { id: "g2", lotId: "lot-skip", seq: 1, event: "intake", handler: "Biren", geo: "Langthasa", season: "Magh 2026", createdAt: "2026-01-02" },
    ]);
    assert.equal(skip.conserved, false);
    assert.deepEqual(repairedGiPath(lot({ id: "lot-skip", status: "in_warehouse" }), []), ["mint", "intake"]);
  });

  it("conserves Ronghang herd heads on the cell; orphans break", () => {
    const cells = [{ id: "c-ronghang", name: "Biren Ronghang", household: "Ronghang house", remainingGrams: 180000 }];
    const herd = [
      { id: "herd-ronghang-cattle", cellId: "c-ronghang", cellName: "Biren Ronghang", kind: "cattle", head: 2, policyId: "POL-LANGTHASA-HERD", coverStatus: "bound" },
      { id: "herd-ronghang-goat", cellId: "c-ronghang", cellName: "Biren Ronghang", kind: "goat", head: 4, policyId: "POL-LANGTHASA-HERD", coverStatus: "bound" },
    ];
    const ok = herdCellLineage(herd, cells);
    assert.equal(ok.conserved, true);
    assert.equal(ok.remaining, 6);
    assert.equal(ok.rupee, null);
    const orphan = herdCellLineage(
      [{ id: "h-x", cellId: "c-missing", cellName: "Ghost", kind: "pig", head: 1, policyId: null, coverStatus: "gap" }],
      cells,
    );
    assert.equal(orphan.conserved, false);
  });

  it("conserves person = home = village and lot remaining on the cell", () => {
    const cells = [
      { id: "c1", name: "Enghi", household: "H1", remainingGrams: 100000 },
      { id: "c2", name: "Langthasa", household: "H1", remainingGrams: 80000 },
    ];
    const lots = [
      lot({ id: "a", cellId: "c1", remainingGrams: 100000, grams: 100000, giMinted: false, giMarker: null }),
      lot({ id: "b", cellId: "c2", remainingGrams: 80000, grams: 80000, giMinted: false, giMarker: null }),
    ];
    const ok = nestedLineage(cells, lots);
    assert.equal(ok.conserved, true);
    assert.equal(ok.remaining, 180000);
    const drift = nestedLineage(cells, [lot({ id: "a", cellId: "c1", remainingGrams: 10, grams: 10, giMinted: false, giMarker: null })]);
    assert.equal(drift.conserved, false);
  });

  it("repair names the break and keeps livestock cash missing", () => {
    const wiring = repairLineages({
      lots: [lot({ id: "lot-gap", status: "in_warehouse" })],
      giChain: [],
      herd: [{ id: "herd-ronghang-cattle", cellId: "c-ronghang", cellName: "Biren Ronghang", kind: "cattle", head: 2, policyId: "POL-LANGTHASA-HERD", coverStatus: "bound" }],
      cells: [{ id: "c-ronghang", name: "Biren Ronghang", household: "Ronghang house", remainingGrams: 0 }],
    });
    assert.equal(wiring.rupee, null);
    assert.equal(wiring.livestockCash, "missing");
    assert.equal(wiring.githubMedical, "refused");
    assert.equal(wiring.afreraVet, "living");
    assert.equal(wiring.conserved, false);
    assert.ok(wiring.repaired.some((r) => /lot-gap expects mint → intake/.test(r)));
  });
});
