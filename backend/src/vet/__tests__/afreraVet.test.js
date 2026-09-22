"use strict";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { SPECIES, SYSTEMS, proposeVet, confirmVet, giLotLineage } = require("../afreraVet");

describe("AFRERA-VET overlay", () => {
  it("names village animals and refuses GitHub human ICD", () => {
    assert.equal(SPECIES.length, 9);
    assert.equal(SYSTEMS.find((s) => s.id === "afrera-vet")?.status, "living");
    assert.equal(SYSTEMS.find((s) => s.id === "github-human-icd")?.status, "refused");
  });

  it("proposes mastitis, names ASF, refuses diabetes", () => {
    const mas = proposeVet({ species: "cattle", signs: ["hot-udder", "clotted-milk"] });
    assert.equal(mas.decision, "propose");
    assert.equal(mas.code.id, "AV-BOV-MAS");
    assert.equal(mas.rupeeWrite, false);
    const asf = proposeVet({ species: "pig", signs: ["fever", "blotching"] });
    assert.equal(asf.decision, "named");
    assert.equal(confirmVet({ species: "pig", codeId: "AV-SUI-ASF", heads: 4, remainingHeads: 4 }).decision, "block");
    const icd = proposeVet({ species: "cattle", signs: ["hot-udder"], humanCode: "ICD-10 E11.9" });
    assert.equal(icd.decision, "refuse");
  });

  it("conserves heads and GI remaining, never a rupee", () => {
    const ok = confirmVet({ species: "cattle", codeId: "AV-BOV-MAS", heads: 2, remainingHeads: 1 });
    assert.equal(ok.decision, "pass");
    assert.equal(ok.remainingHeads, 1);
    assert.equal(ok.rupee, null);
    assert.equal(ok.freezeEmi, false);
    const lot = { id: "lot-x", grams: 180000, remainingGrams: 180000, giMinted: true, giMarker: "GI-AS-CHAKHAO", status: "minted" };
    const live = giLotLineage(lot, [{ lotId: "lot-x", seq: 1, event: "mint" }]);
    assert.equal(live.conserved, true);
    const broken = giLotLineage({ ...lot, remainingGrams: 200000 }, []);
    assert.equal(broken.conserved, false);
    assert.equal(broken.rupee, null);
  });
});
