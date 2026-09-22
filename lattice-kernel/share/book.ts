/** Book village muscle. Hours conserved. Rent and GST invoice refused. */

import { ASSET_BY_ID } from "./catalog.ts";
import type { AssetId, SlotConfirm, SlotProposal } from "./types.ts";

export function proposeSlot(input: {
  assetId: string;
  hours: number;
  remainingHours: number;
  rentPaise?: number | null;
  invoice?: boolean;
  heat?: boolean;
}): SlotProposal {
  const closed = (extra: Partial<SlotProposal> & Pick<SlotProposal, "decision" | "reason">): SlotProposal => ({
    assetId: (ASSET_BY_ID[input.assetId as AssetId]?.id ?? null) as AssetId | null,
    hours: input.hours,
    remainingHours: input.remainingHours,
    clerkRequired: true,
    rupeeWrite: false,
    amountPaise: null,
    yield: null,
    freezeEmi: false,
    ...extra,
  });

  if (input.rentPaise != null) {
    return closed({
      decision: "refuse",
      reason: "Rental rupees stay missing. Hours may book. Do not invent ₹/hour.",
    });
  }
  if (input.invoice) {
    return closed({
      decision: "refuse",
      reason: "GST invoice stays missing. Pack may name an HSN. Do not post tax.",
    });
  }
  const asset = ASSET_BY_ID[input.assetId as AssetId];
  if (!asset) {
    return closed({ assetId: null, decision: "refuse", reason: "Unknown muscle. Do not invent an asset." });
  }
  if (!Number.isFinite(input.hours) || input.hours <= 0) {
    return closed({ assetId: asset.id, decision: "defer", reason: "Declared hours required, including a positive slot." });
  }
  if (input.remainingHours > asset.hours) {
    return closed({
      assetId: asset.id,
      decision: "defer",
      reason: "Remaining hours cannot exceed capacity. Clerk names the window.",
    });
  }
  if (input.heat && asset.kind === "mill") {
    return closed({
      assetId: asset.id,
      decision: "defer",
      reason: "Mill rests on heat. Hours held. EMI not frozen. Clerk still writes remaining.",
    });
  }
  if (input.hours > input.remainingHours) {
    return closed({
      assetId: asset.id,
      decision: "defer",
      reason: `${asset.name} has ${input.remainingHours} h remaining. Do not overbook.`,
    });
  }
  return closed({
    assetId: asset.id,
    decision: "propose",
    reason: `Propose ${input.hours} h on ${asset.name}. Clerk confirms. Rent undeclared. GST invoice refused.`,
  });
}

export function confirmSlot(input: {
  assetId: string;
  hours: number;
  remainingHours: number;
}): SlotConfirm {
  const block = (reason: string, remainingHours = input.remainingHours): SlotConfirm => ({
    assetId: (input.assetId as AssetId) || ("cold-static" as AssetId),
    hours: input.hours,
    remainingHours,
    moved: false,
    rupee: null,
    freezeEmi: false,
    decision: "block",
    reason,
  });
  const asset = ASSET_BY_ID[input.assetId as AssetId];
  if (!asset) return block("Unknown muscle. Clerk cannot confirm an invented asset.");
  if (!Number.isFinite(input.hours) || input.hours <= 0) return block("Declared hours required.");
  if (input.remainingHours > asset.hours) return block("Remaining hours cannot exceed capacity.");
  if (input.hours > input.remainingHours) return block("Hours cannot exceed remaining.");
  const remaining = input.remainingHours - input.hours;
  return {
    assetId: asset.id,
    hours: input.hours,
    remainingHours: remaining,
    moved: remaining !== input.remainingHours,
    rupee: null,
    freezeEmi: false,
    decision: "pass",
    reason: `${asset.name}: ${input.hours} h booked. ${remaining} h remain. Rent undeclared. GST invoice refused.`,
  };
}
