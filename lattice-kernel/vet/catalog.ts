/** Named species and village codes. GitHub human ICD stays a cadaver. */

import type { CodeSystem, Species, SpeciesId, VetCode } from "./types.ts";

export const SPECIES: Species[] = [
  {
    id: "cattle",
    name: "Cattle",
    family: "bovine",
    human: "Dairy / draught",
    present: "Ronghang cattle are a cell fact. POL-LANGTHASA-HERD binds on declared headcount.",
    missing: "Milk rupees, chill kWh, dairy society cashflow.",
  },
  {
    id: "buffalo",
    name: "Buffalo",
    family: "bovine",
    human: "Dairy",
    present: "Named bovine genome. Same herd cover analog.",
    missing: "Murrah yield twin. Milk settlement.",
  },
  {
    id: "goat",
    name: "Goat",
    family: "caprine",
    human: "Meat / milk",
    present: "Ronghang goats sit on the same cell as cattle.",
    missing: "PPR campaign rails.",
  },
  {
    id: "pig",
    name: "Pig",
    family: "swine",
    human: "Meat",
    present: "Named swine genome. Headcount is a clerk fact.",
    missing: "ASF lab confirmation network.",
  },
  {
    id: "poultry",
    name: "Poultry",
    family: "avian",
    human: "Birds for eggs and meat",
    present: "Named avian genome. Heat rest applies to the shed as to the mill.",
    missing: "Hatchery lot body.",
  },
  {
    id: "duck",
    name: "Duck",
    family: "avian",
    human: "Pond bird",
    present: "Named with poultry. Pond is a cell note, not a CFD.",
    missing: "Pond twin.",
  },
  {
    id: "fish",
    name: "Fish",
    family: "aquatic",
    human: "Pond / tank",
    present: "Named aquatic genome. Dissolved oxygen is a declared reading, never invented.",
    missing: "Fisheries cashflow. Water cloud.",
  },
  {
    id: "dog",
    name: "Dog",
    family: "companion",
    human: "Pet / guardian",
    present: "Companion animal on the household. Rabies is a vaccination fact.",
    missing: "Municipal vaccine rails.",
  },
  {
    id: "cat",
    name: "Cat",
    family: "companion",
    human: "Pet",
    present: "Companion animal on the household.",
    missing: "Urban clinic network.",
  },
];

export const SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

function c(
  id: string,
  species: VetCode["species"],
  label: string,
  signs: string[],
  analog: string,
  status: VetCode["status"],
  present: string,
  missing: string,
): VetCode {
  return { id, system: "afrera-vet", species, label, signs, analog, status, present, missing };
}

export const VET_CODES: VetCode[] = [
  c("AV-BOV-MAS", ["cattle", "buffalo"], "Mastitis", ["hot-udder", "clotted-milk", "drop-in-yield"], "ICD-11 analog QA00 mastitis", "living", "Named on dairy cattle. Clerk confirms. Milk rupees stay undeclared.", "Culture lab, SCC device."),
  c("AV-BOV-FMD", ["cattle", "buffalo", "goat", "pig"], "Foot-and-mouth", ["vesicles", "lameness", "drool"], "WOAH listed. Not a silent diagnose.", "living", "Named. Suspect defers. Lab confirmation missing.", "Lab network."),
  c("AV-BOV-LSD", ["cattle", "buffalo"], "Lumpy skin", ["nodules", "fever", "drop-in-yield"], "WOAH listed.", "partial", "Named. Campaign rails missing.", "Vaccine stock."),
  c("AV-BOV-HS", ["cattle", "buffalo"], "Haemorrhagic septicaemia", ["fever", "swollen-throat", "sudden-death"], "Pasteurella analog.", "partial", "Named wet-season risk.", "Lab."),
  c("AV-BOV-HEAT", ["cattle", "buffalo", "goat", "pig", "poultry"], "Heat stress", ["panting", "shade-seeking", "drop-in-yield"], "Same withdraw reflex as mill heat.", "living", "Heat ≥ 31 C rests the mill and names heat stress. EMI not frozen.", "Shed sensors."),
  c("AV-BOV-WORM", ["cattle", "buffalo", "goat", "pig", "dog", "cat"], "GI parasites", ["bottle-jaw", "scours", "thin"], "Helminth analog.", "living", "Named. Dose rupees undeclared.", "Faecal egg count."),
  c("AV-CAP-PPR", ["goat"], "Peste des petits ruminants", ["fever", "discharge", "diarrhoea"], "WOAH listed.", "partial", "Named. Campaign missing.", "Vaccine rails."),
  c("AV-CAP-MAS", ["goat"], "Caprine mastitis", ["hot-udder", "clotted-milk"], "Mastitis analog.", "living", "Named on milking goats.", "Culture."),
  c("AV-SUI-ASF", ["pig"], "African swine fever", ["fever", "blotching", "sudden-death"], "WOAH listed. Do not auto-confirm.", "named", "Suspect named. Confirmation refused without a lab.", "Lab, cull protocol."),
  c("AV-AVI-ND", ["poultry", "duck"], "Newcastle disease", ["twist-neck", "respiratory", "drop-in-eggs"], "WOAH listed.", "living", "Named avian. Clerk confirms heads.", "Lab."),
  c("AV-AVI-AI", ["poultry", "duck"], "Avian influenza", ["sudden-death", "swollen-comb", "drop-in-eggs"], "WOAH listed. Do not auto-confirm.", "named", "Suspect named. Confirmation refused without a lab.", "Lab."),
  c("AV-AVI-COCC", ["poultry"], "Coccidiosis", ["bloody-droppings", "huddling"], "Eimeria analog.", "living", "Named. Litter is a clerk fact.", "Oocyst count."),
  c("AV-PIS-ICH", ["fish"], "Whitespot / Ich", ["white-spots", "flashing", "gasping"], "Ichthyophthirius analog.", "living", "Named. Pond reading must be declared.", "Microscope."),
  c("AV-PIS-AER", ["fish"], "Aeromonas / ulcer", ["ulcers", "fin-rot", "lethargy"], "Bacterial analog.", "partial", "Named. Water quality undeclared stays blank.", "Culture."),
  c("AV-PIS-O2", ["fish"], "Low dissolved oxygen", ["gasping", "surface-piping"], "Declared mg/L. Never invented.", "living", "Same as undeclared kWh: wait, do not invent.", "DO probe."),
  c("AV-CAN-RAB", ["dog", "cat"], "Rabies vaccination fact", ["bite-risk", "neurologic"], "Preventive fact, not a diagnosis theatre.", "living", "Vaccination is a clerk/vet fact. Amount blank.", "Municipal rails."),
  c("AV-CAN-PARVO", ["dog"], "Canine parvovirus", ["bloody-scours", "vomiting", "young"], "Named companion.", "partial", "Named. Clinic network missing.", "ELISA."),
  c("AV-CAN-TICK", ["dog", "cattle", "goat"], "Tick-borne fever", ["fever", "ticks", "pale-gums"], "Vector analog.", "living", "Named. Acaricide rupees undeclared.", "Smear."),
  c("AV-FEL-URI", ["cat"], "Feline upper respiratory", ["sneezing", "discharge", "conjunctivitis"], "Named companion.", "partial", "Named. Clinic network missing.", "PCR."),
];

export const CODE_BY_ID: Record<string, VetCode> = Object.fromEntries(VET_CODES.map((row) => [row.id, row]));

export const CODE_SYSTEMS: {
  id: CodeSystem;
  name: string;
  status: "living" | "partial" | "missing" | "refused";
  present: string;
  missing: string;
}[] = [
  {
    id: "afrera-vet",
    name: "AFRERA-VET",
    status: "living",
    present: "Named village codes on cattle, buffalo, goat, pig, poultry, duck, fish, dog, cat.",
    missing: "Full WOAH lab confirmation.",
  },
  {
    id: "icd11-vet-analog",
    name: "ICD-11 veterinary analog",
    status: "partial",
    present: "Each living code names an analog. Not a licensed ICD dump.",
    missing: "WHO ICD-11 API.",
  },
  {
    id: "snomed-vet-analog",
    name: "SNOMED-VET analog",
    status: "missing",
    present: "Named. No SNOMED subset on this kernel.",
    missing: "SNOMED CT veterinary extension.",
  },
  {
    id: "github-human-icd",
    name: "GitHub human ICD / CPT / HCPCS",
    status: "refused",
    present: "SUBH-DEEP advancedMedicalCodingService claimed 14 human systems. Dietitian and hospital codes are the wrong genome.",
    missing: "Do not paint a hospital coder living on a village herd.",
  },
];

export function codesForSpecies(id: SpeciesId): VetCode[] {
  return VET_CODES.filter((row) => row.species.includes(id));
}

export function signsForSpecies(id: SpeciesId): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of codesForSpecies(id)) {
    for (const sign of row.signs) {
      if (seen.has(sign)) continue;
      seen.add(sign);
      out.push(sign);
    }
  }
  return out;
}
