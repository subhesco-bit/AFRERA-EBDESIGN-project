/** GST analog. HSN may name the sack. Invoice and rate stay missing. */

import { HSN_BY_ID, HSN_ROWS } from "./catalog.ts";
import type { GstVerdict, HsnRow, SubsidyCode, SubsidyVerdict } from "./types.ts";

export function classifyHsn(commodity: string): HsnRow {
  const key = commodity.trim().toLowerCase();
  if (/rice|chakhao/.test(key)) return HSN_BY_ID["1006"];
  if (/ginger/.test(key)) return HSN_BY_ID["0910"];
  if (/milk|dairy/.test(key)) return HSN_BY_ID["0401"];
  if (/bran/.test(key)) return HSN_BY_ID["2302"];
  if (/fruit|mango|banana/.test(key)) return HSN_BY_ID["0810"];
  if (/veg|onion|tomato|potato|chilli/.test(key)) return HSN_BY_ID["0709"];
  return HSN_ROWS[0];
}

export function gstInvoice(input: { commodity: string; post?: boolean }): GstVerdict {
  const hsn = classifyHsn(input.commodity);
  if (input.post) {
    return {
      decision: "refuse",
      hsn,
      invoice: false,
      amountPaise: null,
      rupeeWrite: false,
      reason: `HSN ${hsn.id} ${hsn.label} is named. GST e-invoice stays missing. Do not post tax.`,
    };
  }
  return {
    decision: "named",
    hsn,
    invoice: false,
    amountPaise: null,
    rupeeWrite: false,
    reason: `Pack may carry HSN ${hsn.id} ${hsn.label}. Rate blank. E-invoice missing.`,
  };
}

export function packForGst(input: { commodity: string; packed: boolean }): GstVerdict {
  const hsn = classifyHsn(input.commodity);
  if (!input.packed) {
    return {
      decision: "named",
      hsn,
      invoice: false,
      amountPaise: null,
      rupeeWrite: false,
      reason: "Pack hours may book. HSN waits on a packed sack. GST invoice missing.",
    };
  }
  return gstInvoice({ commodity: input.commodity, post: false });
}

export function subsidyFor(input: {
  code: SubsidyCode;
  horticulture: boolean;
  fpo: boolean;
  perishable: boolean;
  northEast: boolean;
  freightDeclared: boolean;
  amountPaise?: number | null;
}): SubsidyVerdict {
  if (input.amountPaise != null) {
    return {
      code: input.code,
      eligible: false,
      amountPaise: null,
      disbursement: "missing",
      reason: "Subsidy rupees stay undeclared. Eligibility may compute. Do not invent a payout.",
    };
  }
  if (input.code === "OP-GREEN") {
    const ok = input.horticulture && input.fpo && input.perishable;
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
  const ok = input.northEast && input.freightDeclared;
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
