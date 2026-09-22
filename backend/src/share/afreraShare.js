"use strict";

/**
 * Shared village muscle overlay on consolidated/final.
 * Hours conserved like remaining grams. GST invoice and rental rupees stay missing.
 * Operation Green / NE logistics eligibility compute with amount blank.
 */

const ASSETS = Object.freeze([
  { id: "cold-static", name: "Langthasa cold bay", kind: "cold", hours: 24 },
  { id: "mill-static", name: "Village mill", kind: "mill", hours: 12 },
  { id: "process-static", name: "Static food process", kind: "process", hours: 8 },
  { id: "process-mobile", name: "Mobile food process", kind: "process", hours: 6 },
  { id: "pack-static", name: "Static packhouse", kind: "pack", hours: 8 },
  { id: "pack-mobile", name: "Mobile pack unit", kind: "pack", hours: 4 },
  { id: "lab-food", name: "Mobile food lab", kind: "lab", hours: 4 },
  { id: "lab-soil", name: "Mobile soil lab", kind: "lab", hours: 4 },
  { id: "lab-animal", name: "Mobile animal lab", kind: "lab", hours: 4 },
  { id: "dryer-shared", name: "Shared dryer", kind: "dryer", hours: 10 },
  { id: "poly-fpo", name: "FPO polyhouse", kind: "polyhouse", hours: 12 },
  { id: "equip-pool", name: "Shared equipment pool", kind: "equipment", hours: 8 },
]);

const HSN = Object.freeze({
  rice: "1006",
  ginger: "0910",
  veg: "0709",
  fruit: "0810",
  milk: "0401",
  bran: "2302",
});

function proposeSlot(input) {
  const base = { clerkRequired: true, rupeeWrite: false, amountPaise: null, yield: null, freezeEmi: false };
  if (input?.rentPaise != null) {
    return { ...base, assetId: input.assetId ?? null, decision: "refuse", reason: "Rental rupees stay missing. Hours may book. Do not invent ₹/hour." };
  }
  if (input?.invoice) {
    return { ...base, assetId: input.assetId ?? null, decision: "refuse", reason: "GST invoice stays missing. Pack may name an HSN. Do not post tax." };
  }
  const asset = ASSETS.find((a) => a.id === input?.assetId);
  if (!asset) return { ...base, assetId: null, decision: "refuse", reason: "Unknown muscle. Do not invent an asset." };
  const hours = Number(input.hours);
  const remainingHours = Number(input.remainingHours);
  if (!Number.isFinite(hours) || hours <= 0) {
    return { ...base, assetId: asset.id, decision: "defer", reason: "Declared hours required, including a positive slot." };
  }
  if (input.heat && asset.kind === "mill") {
    return { ...base, assetId: asset.id, decision: "defer", reason: "Mill rests on heat. Hours held. EMI not frozen." };
  }
  if (hours > remainingHours) {
    return { ...base, assetId: asset.id, decision: "defer", reason: `${asset.name} has ${remainingHours} h remaining. Do not overbook.` };
  }
  return { ...base, assetId: asset.id, decision: "propose", reason: `Propose ${hours} h on ${asset.name}. Clerk confirms. Rent undeclared. GST invoice refused.` };
}

function confirmSlot(input) {
  const asset = ASSETS.find((a) => a.id === input?.assetId);
  const hours = Number(input?.hours);
  const remainingHours = Number(input?.remainingHours);
  const block = (reason) => ({
    assetId: input?.assetId ?? null,
    hours,
    remainingHours,
    moved: false,
    rupee: null,
    freezeEmi: false,
    decision: "block",
    reason,
  });
  if (!asset) return block("Unknown muscle. Clerk cannot confirm an invented asset.");
  if (!Number.isFinite(hours) || hours <= 0) return block("Declared hours required.");
  if (remainingHours > asset.hours) return block("Remaining hours cannot exceed capacity.");
  if (hours > remainingHours) return block("Hours cannot exceed remaining.");
  const remaining = remainingHours - hours;
  return {
    assetId: asset.id,
    hours,
    remainingHours: remaining,
    moved: remaining !== remainingHours,
    rupee: null,
    freezeEmi: false,
    decision: "pass",
    reason: `${asset.name}: ${hours} h booked. ${remaining} h remain. Rent undeclared. GST invoice refused.`,
  };
}

function classifyHsn(commodity) {
  const key = String(commodity ?? "").toLowerCase();
  if (/rice|chakhao/.test(key)) return { id: HSN.rice, label: "Rice", ratePaise: null };
  if (/ginger/.test(key)) return { id: HSN.ginger, label: "Ginger", ratePaise: null };
  if (/milk|dairy/.test(key)) return { id: HSN.milk, label: "Milk", ratePaise: null };
  if (/bran/.test(key)) return { id: HSN.bran, label: "Bran", ratePaise: null };
  if (/fruit|mango|banana/.test(key)) return { id: HSN.fruit, label: "Other fruit", ratePaise: null };
  return { id: HSN.veg, label: "Other vegetables", ratePaise: null };
}

function gstInvoice(input) {
  const hsn = classifyHsn(input?.commodity);
  if (input?.post) {
    return { decision: "refuse", hsn, invoice: false, amountPaise: null, rupeeWrite: false, reason: `HSN ${hsn.id} ${hsn.label} is named. GST e-invoice stays missing. Do not post tax.` };
  }
  return { decision: "named", hsn, invoice: false, amountPaise: null, rupeeWrite: false, reason: `Pack may carry HSN ${hsn.id} ${hsn.label}. Rate blank. E-invoice missing.` };
}

function subsidyFor(input) {
  if (input?.amountPaise != null) {
    return { code: input.code, eligible: false, amountPaise: null, disbursement: "missing", reason: "Subsidy rupees stay undeclared. Eligibility may compute. Do not invent a payout." };
  }
  if (input?.code === "OP-GREEN") {
    const ok = Boolean(input.horticulture && input.fpo && input.perishable);
    return {
      code: "OP-GREEN",
      eligible: ok,
      amountPaise: null,
      disbursement: "missing",
      reason: ok
        ? "Operation Green: FPO perishable horticulture. Amount blank. Disbursement missing."
        : "Operation Green needs FPO + perishable horticulture. Amount blank.",
    };
  }
  const ok = Boolean(input?.northEast && input?.freightDeclared);
  return {
    code: "NE-LOGISTICS",
    eligible: ok,
    amountPaise: null,
    disbursement: "missing",
    reason: ok
      ? "NE logistics policy: declared freight from the North-East. Amount blank."
      : "NE logistics needs a NE village and declared freight. Amount blank.",
  };
}

function organicTrace(input) {
  const lot = input?.lot ?? {};
  const claim = input?.claim ?? "none";
  const broken = [];
  if ((lot.remainingGrams ?? 0) > (lot.grams ?? 0)) broken.push("remaining exceeds minted grams");
  if (claim === "none") broken.push("organic claim undeclared — PGS/NPOP stays named");
  const conserved = broken.length === 0 && claim !== "none";
  return {
    lotId: lot.id ?? null,
    conserved,
    path: ["mint"],
    broken,
    organic: claim,
    rupee: null,
    gst: "missing",
    reason: conserved
      ? `${lot.variety ?? "lot"} traces mint. ${String(claim).toUpperCase()} declared. GST invoice missing.`
      : broken[0] ?? "Organic path named. Do not invent a certificate rupee.",
  };
}

module.exports = {
  ASSETS,
  HSN,
  proposeSlot,
  confirmSlot,
  classifyHsn,
  gstInvoice,
  subsidyFor,
  organicTrace,
};
