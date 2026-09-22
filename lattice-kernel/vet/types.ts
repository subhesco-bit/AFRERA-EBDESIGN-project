/** Veterinary medical coding. Animals are a second genome. Map, do not invent ICD. */

export type SpeciesId =
  | "cattle"
  | "buffalo"
  | "goat"
  | "pig"
  | "poultry"
  | "duck"
  | "fish"
  | "dog"
  | "cat";

export type SpeciesFamily = "bovine" | "caprine" | "swine" | "avian" | "aquatic" | "companion";

export type CodeSystem = "afrera-vet" | "icd11-vet-analog" | "snomed-vet-analog" | "github-human-icd";

export type CodeStatus = "living" | "partial" | "named" | "refused";

export type Species = {
  id: SpeciesId;
  name: string;
  family: SpeciesFamily;
  human: string;
  present: string;
  missing: string;
};

export type VetCode = {
  id: string;
  system: "afrera-vet";
  species: SpeciesId[];
  label: string;
  signs: string[];
  analog: string;
  status: CodeStatus;
  present: string;
  missing: string;
};

export type LineageKind = "gi-lot" | "herd-cell" | "person-home-village";

export type LineageReport = {
  kind: LineageKind;
  conserved: boolean;
  broken: string[];
  path: string[];
  remaining: number;
  rupee: null;
  reason: string;
};

export type WiringReport = {
  reports: LineageReport[];
  conserved: boolean;
  broken: string[];
  repaired: string[];
  rupee: null;
  livestockCash: "missing";
  githubMedical: "refused";
  afreraVet: "living";
};

export type VetProposal = {
  species: SpeciesId | null;
  code: VetCode | null;
  decision: "propose" | "defer" | "refuse" | "named";
  clerkRequired: true;
  rupeeWrite: false;
  amountPaise: null;
  yield: null;
  freezeEmi: false;
  reason: string;
};

export type VetConfirm = {
  species: SpeciesId;
  codeId: string;
  heads: number;
  remainingHeads: number;
  moved: boolean;
  rupee: null;
  freezeEmi: false;
  decision: "pass" | "block";
  reason: string;
};
