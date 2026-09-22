import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GiLinkRow, LotRow } from "../erp/types.ts";
import {
  ASSETS,
  classifyHsn,
  confirmSlot,
  gstInvoice,
  organicTrace,
  packForGst,
  proposeSlot,
  shareWiring,
  subsidyFor,
} from "./index.ts";

function lot(partial: Partial<LotRow> & { id: string }): LotRow {
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

describe("shared village muscle", () => {
  it("names twelve FPO assets and conserves hours", () => {
    assert.equal(ASSETS.length, 12);
    assert.ok(ASSETS.every((a) => a.fpo && a.status === "living"));
    assert.ok(ASSETS.some((a) => a.id === "cold-static"));
    assert.ok(ASSETS.some((a) => a.id === "process-mobile"));
    assert.ok(ASSETS.some((a) => a.id === "lab-animal"));
    assert.ok(ASSETS.some((a) => a.id === "poly-fpo"));
    const p = proposeSlot({ assetId: "cold-static", hours: 4, remainingHours: 24 });
    assert.equal(p.decision, "propose");
    assert.equal(p.rupeeWrite, false);
    assert.equal(p.amountPaise, null);
    assert.equal(p.freezeEmi, false);
    const ok = confirmSlot({ assetId: "cold-static", hours: 4, remainingHours: 24 });
    assert.equal(ok.decision, "pass");
    assert.equal(ok.remainingHours, 20);
    assert.equal(ok.rupee, null);
    assert.equal(ok.moved, true);
  });

  it("refuses rental rupees and GST invoices; rests the mill when hot", () => {
    const rent = proposeSlot({ assetId: "equip-pool", hours: 2, remainingHours: 8, rentPaise: 400 });
    assert.equal(rent.decision, "refuse");
    assert.match(rent.reason, /Rental rupees/);
    const inv = proposeSlot({ assetId: "pack-static", hours: 1, remainingHours: 8, invoice: true });
    assert.equal(inv.decision, "refuse");
    assert.match(inv.reason, /GST invoice/);
    const hot = proposeSlot({ assetId: "mill-static", hours: 2, remainingHours: 12, heat: true });
    assert.equal(hot.decision, "defer");
    assert.match(hot.reason, /Mill rests/);
    assert.equal(hot.freezeEmi, false);
  });

  it("cannot overbook or grow remaining hours", () => {
    assert.equal(confirmSlot({ assetId: "dryer-shared", hours: 11, remainingHours: 10 }).decision, "block");
    assert.equal(confirmSlot({ assetId: "dryer-shared", hours: 1, remainingHours: 11 }).decision, "block");
    assert.equal(proposeSlot({ assetId: "ghost", hours: 1, remainingHours: 1 }).decision, "refuse");
  });
});

describe("organic tracing", () => {
  it("traces a declared PGS lot and names a broken path", () => {
    const chain: GiLinkRow[] = [
      { id: "g1", lotId: "lot-ok", seq: 1, event: "mint", handler: "Biren", geo: "Langthasa", season: "Magh 2026", createdAt: "2026-01-01" },
    ];
    const ok = organicTrace({ lot: lot({ id: "lot-ok" }), giChain: chain, claim: "pgs" });
    assert.equal(ok.conserved, true);
    assert.deepEqual(ok.path, ["mint"]);
    assert.equal(ok.rupee, null);
    assert.equal(ok.gst, "missing");
    const none = organicTrace({ lot: lot({ id: "lot-ok" }), giChain: chain, claim: "none" });
    assert.equal(none.conserved, false);
    const packed = organicTrace({
      lot: lot({ id: "lot-ok", status: "listed" }),
      giChain: chain,
      claim: "npop",
      packed: true,
    });
    assert.deepEqual(packed.path, ["mint", "intake", "process", "pack"]);
    assert.equal(packed.conserved, true);
  });

  it("keeps GST, rent, and subsidy amount missing on the wiring", () => {
    const w = shareWiring({ remainingHours: 20, capacityHours: 24, organic: null });
    assert.equal(w.hoursConserved, true);
    assert.equal(w.gst, "missing");
    assert.equal(w.rentalRupees, "missing");
    assert.equal(w.subsidyAmount, "missing");
    assert.equal(w.rupee, null);
  });
});

describe("GST analog and Operation Green", () => {
  it("names HSN and refuses a posted invoice", () => {
    assert.equal(classifyHsn("Chakhao rice").id, "1006");
    assert.equal(classifyHsn("ginger").id, "0910");
    const named = packForGst({ commodity: "rice", packed: true });
    assert.equal(named.decision, "named");
    assert.equal(named.amountPaise, null);
    assert.equal(named.invoice, false);
    const post = gstInvoice({ commodity: "rice", post: true });
    assert.equal(post.decision, "refuse");
    assert.equal(post.rupeeWrite, false);
  });

  it("computes Operation Green and NE logistics with amount blank", () => {
    const green = subsidyFor({
      code: "OP-GREEN",
      horticulture: true,
      fpo: true,
      perishable: true,
      northEast: true,
      freightDeclared: false,
    });
    assert.equal(green.eligible, true);
    assert.equal(green.amountPaise, null);
    assert.equal(green.disbursement, "missing");
    const miss = subsidyFor({
      code: "OP-GREEN",
      horticulture: false,
      fpo: true,
      perishable: true,
      northEast: true,
      freightDeclared: false,
    });
    assert.equal(miss.eligible, false);
    const ne = subsidyFor({
      code: "NE-LOGISTICS",
      horticulture: false,
      fpo: true,
      perishable: false,
      northEast: true,
      freightDeclared: true,
    });
    assert.equal(ne.eligible, true);
    assert.equal(ne.amountPaise, null);
    const paid = subsidyFor({
      code: "OP-GREEN",
      horticulture: true,
      fpo: true,
      perishable: true,
      northEast: true,
      freightDeclared: true,
      amountPaise: 1,
    });
    assert.equal(paid.eligible, false);
    assert.match(paid.reason, /undeclared/);
  });
});
