/** August AI proposes village codes. Clerk/vet confirms. Human ICD is the wrong genome. */

import { CODE_BY_ID, SPECIES_BY_ID, VET_CODES } from "./catalog.ts";
import type { SpeciesId, VetConfirm, VetProposal } from "./types.ts";

const HUMAN_GENOME =
  /\b(diabetes|icd-?10|icd-?11|cpt|hcpcs|e11(?:\.\d+)?|hospital|dietitian|natural therapist|human coding)\b/i;

const RANK: Record<string, number> = { living: 3, partial: 2, named: 1, refused: 0 };

function refuse(reason: string, species: SpeciesId | null = null): VetProposal {
  return {
    species,
    code: null,
    decision: "refuse",
    clerkRequired: true,
    rupeeWrite: false,
    amountPaise: null,
    yield: null,
    freezeEmi: false,
    reason,
  };
}

export function isHumanGenome(text: string): boolean {
  return HUMAN_GENOME.test(text);
}

export function proposeVet(input: {
  species: string;
  signs?: string[];
  note?: string;
}): VetProposal {
  const blob = `${input.species} ${(input.signs ?? []).join(" ")} ${input.note ?? ""}`;
  if (isHumanGenome(blob)) {
    return refuse(
      "Human ICD / CPT / HCPCS / diabetes is the wrong genome. GitHub medical coding stays a cadaver. AFRERA-VET codes animals.",
    );
  }
  const species = SPECIES_BY_ID[input.species]?.id as SpeciesId | undefined;
  if (!species) {
    return refuse(`Unknown species ${input.species}. Do not invent a genome.`);
  }
  const signs = new Set((input.signs ?? []).map((s) => s.trim()).filter(Boolean));
  const matches = VET_CODES.filter((row) => row.species.includes(species) && row.signs.some((s) => signs.has(s))).sort(
    (a, b) => {
      const overlapA = a.signs.filter((s) => signs.has(s)).length;
      const overlapB = b.signs.filter((s) => signs.has(s)).length;
      if (overlapB !== overlapA) return overlapB - overlapA;
      return (RANK[b.status] ?? 0) - (RANK[a.status] ?? 0);
    },
  );
  const code = matches[0] ?? null;
  if (!code) {
    return {
      species,
      code: null,
      decision: "defer",
      clerkRequired: true,
      rupeeWrite: false,
      amountPaise: null,
      yield: null,
      freezeEmi: false,
      reason: `No named AFRERA-VET code on ${species} for those signs. Clerk/vet names the sign. Do not dump ICD-10 onto the herd.`,
    };
  }
  if (code.status === "named") {
    return {
      species,
      code,
      decision: "named",
      clerkRequired: true,
      rupeeWrite: false,
      amountPaise: null,
      yield: null,
      freezeEmi: false,
      reason: `${code.label} is named, not auto-confirmed. ${code.missing} Lab missing. EMI not frozen.`,
    };
  }
  if (code.status === "partial") {
    return {
      species,
      code,
      decision: "defer",
      clerkRequired: true,
      rupeeWrite: false,
      amountPaise: null,
      yield: null,
      freezeEmi: false,
      reason: `${code.id} ${code.label} is partial. ${code.present} ${code.missing} Amount blank.`,
    };
  }
  return {
    species,
    code,
    decision: "propose",
    clerkRequired: true,
    rupeeWrite: false,
    amountPaise: null,
    yield: null,
    freezeEmi: false,
    reason: `Propose ${code.id} ${code.label} on ${species}. Clerk/vet confirms heads. Milk rupees stay undeclared.`,
  };
}

export function confirmVet(input: {
  species: string;
  codeId: string;
  heads: number;
  remainingHeads: number;
}): VetConfirm {
  const species = (SPECIES_BY_ID[input.species]?.id ?? input.species) as SpeciesId;
  const base = {
    species,
    codeId: input.codeId,
    heads: input.heads,
    remainingHeads: input.remainingHeads,
    moved: false,
    rupee: null,
    freezeEmi: false as const,
  };
  if (isHumanGenome(input.codeId) || isHumanGenome(input.species)) {
    return {
      ...base,
      decision: "block",
      reason: "Human ICD stays refused. Do not confirm a hospital code on a herd.",
    };
  }
  const code = CODE_BY_ID[input.codeId];
  if (!code) {
    return { ...base, decision: "block", reason: `Unknown code ${input.codeId}. Do not invent ICD.` };
  }
  if (!code.species.includes(species)) {
    return { ...base, decision: "block", reason: `${code.id} is not a ${species} code. Wrong genome.` };
  }
  if (code.status === "named") {
    return {
      ...base,
      decision: "block",
      reason: `${code.label} cannot auto-confirm. Lab missing. Named only.`,
    };
  }
  if (input.heads < 0 || input.remainingHeads < 0) {
    return { ...base, decision: "block", reason: "Headcount cannot be negative." };
  }
  if (input.remainingHeads > input.heads) {
    return {
      ...base,
      decision: "block",
      reason: "Remaining heads cannot exceed declared heads. Clerk declares. Do not invent a calf.",
    };
  }
  return {
    ...base,
    remainingHeads: input.remainingHeads,
    moved: false,
    decision: "pass",
    reason: `Confirm ${code.id} on ${species}. ${input.remainingHeads} of ${input.heads} heads remain. Rupee null. EMI not frozen.`,
  };
}
