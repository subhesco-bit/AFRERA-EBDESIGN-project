"use strict";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { ASSETS, proposeSlot, confirmSlot, gstInvoice, subsidyFor, organicTrace } = require("../afreraShare");

describe("shared muscle overlay", () => {
  it("names twelve FPO assets and conserves hours", () => {
    assert.equal(ASSETS.length, 12);
    const p = proposeSlot({ assetId: "cold-static", hours: 4, remainingHours: 24 });
    assert.equal(p.decision, "propose");
    assert.equal(p.rupeeWrite, false);
    const ok = confirmSlot({ assetId: "cold-static", hours: 4, remainingHours: 24 });
    assert.equal(ok.decision, "pass");
    assert.equal(ok.remainingHours, 20);
    assert.equal(ok.rupee, null);
  });

  it("refuses rental rupees and GST invoices", () => {
    assert.equal(proposeSlot({ assetId: "equip-pool", hours: 2, remainingHours: 8, rentPaise: 400 }).decision, "refuse");
    assert.equal(proposeSlot({ assetId: "pack-static", hours: 1, remainingHours: 8, invoice: true }).decision, "refuse");
    const gst = gstInvoice({ commodity: "rice", post: true });
    assert.equal(gst.decision, "refuse");
    assert.equal(gst.amountPaise, null);
  });

  it("traces organic and keeps Operation Green amount blank", () => {
    const t = organicTrace({ lot: { id: "lot-x", variety: "Chakhao", grams: 10, remainingGrams: 10 }, claim: "pgs" });
    assert.equal(t.conserved, true);
    assert.equal(t.gst, "missing");
    const green = subsidyFor({ code: "OP-GREEN", horticulture: true, fpo: true, perishable: true });
    assert.equal(green.eligible, true);
    assert.equal(green.amountPaise, null);
    assert.equal(green.disbursement, "missing");
  });
});
