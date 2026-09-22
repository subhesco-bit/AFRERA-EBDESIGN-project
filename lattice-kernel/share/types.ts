/** Shared village muscle. Hours conserved like remaining grams. GST and rent stay named. */

export type AssetId =
  | "cold-static"
  | "mill-static"
  | "process-static"
  | "process-mobile"
  | "pack-static"
  | "pack-mobile"
  | "lab-food"
  | "lab-soil"
  | "lab-animal"
  | "dryer-shared"
  | "poly-fpo"
  | "equip-pool";

export type AssetKind = "cold" | "mill" | "process" | "pack" | "lab" | "dryer" | "polyhouse" | "equipment";

export type AssetMode = "static" | "mobile" | "shared";

export type ShareStatus = "living" | "partial" | "named" | "missing" | "refused";

export type VillageAsset = {
  id: AssetId;
  name: string;
  kind: AssetKind;
  mode: AssetMode;
  hours: number;
  fpo: true;
  status: ShareStatus;
  present: string;
  missing: string;
};

export type SlotProposal = {
  assetId: AssetId | null;
  hours: number;
  remainingHours: number;
  decision: "propose" | "defer" | "refuse" | "named";
  clerkRequired: true;
  rupeeWrite: false;
  amountPaise: null;
  yield: null;
  freezeEmi: false;
  reason: string;
};

export type SlotConfirm = {
  assetId: AssetId;
  hours: number;
  remainingHours: number;
  moved: boolean;
  rupee: null;
  freezeEmi: false;
  decision: "pass" | "block";
  reason: string;
};

export type OrganicClaim = "pgs" | "npop" | "none";

export type TraceReport = {
  lotId: string;
  conserved: boolean;
  path: string[];
  broken: string[];
  organic: OrganicClaim;
  rupee: null;
  gst: "missing";
  reason: string;
};

export type HsnRow = {
  id: string;
  label: string;
  pack: boolean;
  ratePaise: null;
  status: "named";
};

export type GstVerdict = {
  decision: "named" | "refuse";
  hsn: HsnRow | null;
  invoice: false;
  amountPaise: null;
  rupeeWrite: false;
  reason: string;
};

export type SubsidyCode = "OP-GREEN" | "NE-LOGISTICS";

export type SubsidyVerdict = {
  code: SubsidyCode;
  eligible: boolean;
  amountPaise: null;
  disbursement: "missing";
  reason: string;
};

export type ShareWiring = {
  hoursConserved: boolean;
  organicConserved: boolean;
  gst: "missing";
  rentalRupees: "missing";
  subsidyAmount: "missing";
  rupee: null;
  reason: string;
};
