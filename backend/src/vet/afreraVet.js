"use strict";

/**
 * AFRERA-VET overlay on consolidated/final.
 * Animals are a second genome. GitHub human ICD stays a cadaver.
 * August AI proposes. Clerk/vet confirms heads. Milk rupees stay missing.
 */

const SPECIES = Object.freeze([
  "cattle",
  "buffalo",
  "goat",
  "pig",
  "poultry",
  "duck",
  "fish",
  "dog",
  "cat",
]);

const CODES = Object.freeze([
  { id: "AV-BOV-MAS", species: ["cattle", "buffalo"], label: "Mastitis", signs: ["hot-udder", "clotted-milk", "drop-in-yield"], status: "living" },
  { id: "AV-BOV-FMD", species: ["cattle", "buffalo", "goat", "pig"], label: "Foot-and-mouth", signs: ["vesicles", "lameness", "drool"], status: "living" },
  { id: "AV-BOV-HEAT", species: ["cattle", "buffalo", "goat", "pig", "poultry"], label: "Heat stress", signs: ["panting", "shade-seeking", "drop-in-yield"], status: "living" },
  { id: "AV-CAP-PPR", species: ["goat"], label: "Peste des petits ruminants", signs: ["fever", "discharge", "diarrhoea"], status: "partial" },
  { id: "AV-SUI-ASF", species: ["pig"], label: "African swine fever", signs: ["fever", "blotching", "sudden-death"], status: "named" },
  { id: "AV-AVI-ND", species: ["poultry", "duck"], label: "Newcastle disease", signs: ["twist-neck", "respiratory", "drop-in-eggs"], status: "living" },
  { id: "AV-AVI-AI", species: ["poultry", "duck"], label: "Avian influenza", signs: ["sudden-death", "swollen-comb", "drop-in-eggs"], status: "named" },
  { id: "AV-PIS-ICH", species: ["fish"], label: "Whitespot / Ich", signs: ["white-spots", "flashing", "gasping"], status: "living" },
  { id: "AV-PIS-O2", species: ["fish"], label: "Low dissolved oxygen", signs: ["gasping", "surface-piping"], status: "living" },
  { id: "AV-CAN-RAB", species: ["dog", "cat"], label: "Rabies vaccination fact", signs: ["bite-risk", "neurologic"], status: "living" },
  { id: "AV-FEL-URI", species: ["cat"], label: "Feline upper respiratory", signs: ["sneezing", "discharge", "conjunctivitis"], status: "partial" },
]);

const SYSTEMS = Object.freeze([
  { id: "afrera-vet", status: "living" },
  { id: "icd11-vet-analog", status: "partial" },
  { id: "snomed-vet-analog", status: "missing" },
  { id: "github-human-icd", status: "refused" },
]);

const RANK = Object.freeze({ living: 3, partial: 2, named: 1, refused: 0 });
const HUMAN = /\b(diabetes|icd-?10|icd-?11|cpt|hcpcs|e11\.?9?|dietitian|natural.?therapist|human hospital)\b/i;

function proposeVet(input) {
  const species = String(input?.species ?? "");
  const signs = (input?.signs ?? []).map(String);
  const blob = `${species} ${signs.join(" ")} ${input?.note ?? ""} ${input?.humanCode ?? ""}`;
  const base = { clerkRequired: true, rupeeWrite: false, amountPaise: null, yield: null };
  if (HUMAN.test(blob) || SYSTEMS.find((s) => s.id === "github-human-icd")?.status === "refused" && /icd|cpt|hcpcs/.test(blob.toLowerCase())) {
    return { ...base, species, code: null, decision: "refuse", reason: "Human ICD / CPT / HCPCS / diabetes is the wrong genome. GitHub medical coding stays a cadaver." };
  }
  if (!SPECIES.includes(species)) {
    return { ...base, species, code: null, decision: "refuse", reason: "Unknown species. AFRERA-VET names cattle, buffalo, goat, pig, poultry, duck, fish, dog, cat." };
  }
  const wanted = new Set(signs);
  const hits = CODES.filter((c) => c.species.includes(species) && c.signs.some((s) => wanted.has(s)))
    .sort((a, b) => {
      const oa = a.signs.filter((s) => wanted.has(s)).length;
      const ob = b.signs.filter((s) => wanted.has(s)).length;
      if (ob !== oa) return ob - oa;
      return (RANK[b.status] ?? 0) - (RANK[a.status] ?? 0);
    });
  const code = hits[0] ?? null;
  if (!code) {
    return { ...base, species, code: null, decision: "defer", reason: "No named AFRERA-VET code. Clerk/vet names the sign. Do not invent ICD." };
  }
  if (code.status === "named") {
    return { ...base, species, code, decision: "named", reason: `${code.label} is named, not auto-confirmed. Lab missing. EMI not frozen.` };
  }
  if (code.status === "partial") {
    return { ...base, species, code, decision: "defer", reason: `${code.label} is partial. Campaign rails missing. Clerk still confirms.` };
  }
  return { ...base, species, code, decision: "propose", reason: `Propose ${code.id} ${code.label} on ${species}. Clerk/vet confirms heads. Milk rupees stay undeclared.` };
}

function confirmVet(input) {
  const species = String(input?.species ?? "");
  const code = CODES.find((c) => c.id === input?.codeId) ?? null;
  const heads = Number(input?.heads);
  const remainingHeads = Number(input?.remainingHeads);
  const base = { species, codeId: input?.codeId ?? "", heads, remainingHeads, rupee: null, freezeEmi: false };
  if (!code) return { ...base, moved: false, decision: "block", reason: "Unknown AFRERA-VET code. Do not invent ICD." };
  if (!code.species.includes(species)) return { ...base, moved: false, decision: "block", reason: `${code.id} is not a ${species} code.` };
  if (code.status === "named") return { ...base, moved: false, decision: "block", reason: `${code.label} cannot auto-confirm. Lab missing. Named only.` };
  if (!(heads >= 0) || !(remainingHeads >= 0)) return { ...base, moved: false, decision: "block", reason: "Headcount must be a declared non-negative integer." };
  if (remainingHeads > heads) return { ...base, moved: false, decision: "block", reason: "Remaining heads cannot exceed declared heads. Do not invent a herd." };
  return { ...base, moved: remainingHeads < heads, decision: "pass", reason: `Confirm ${code.id} on ${species}. ${remainingHeads} of ${heads} heads remain. Rupee null. EMI not frozen.` };
}

function giLotLineage(lot, chain) {
  const links = (chain ?? []).filter((g) => g.lotId === lot.id).sort((a, b) => a.seq - b.seq);
  const path = links.map((g) => g.event);
  const broken = [];
  if (lot.remainingGrams < 0 || lot.remainingGrams > lot.grams) broken.push(`${lot.id}: remaining not conserved.`);
  const gi = Boolean(lot.giMinted || lot.giMarker);
  const expected = lot.status === "settled" && gi ? ["mint", "intake", "settle"] : gi ? ["mint"] : [];
  for (const event of expected) {
    if (!path.includes(event)) broken.push(`${lot.id}: missing GI ${event}.`);
  }
  return { kind: "gi-lot", conserved: broken.length === 0, broken, path, remaining: lot.remainingGrams, rupee: null, reason: broken[0] ?? "GI token path conserved. Rupee null." };
}

module.exports = {
  SPECIES,
  CODES,
  SYSTEMS,
  proposeVet,
  confirmVet,
  giLotLineage,
};
