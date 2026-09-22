/** GI token path, herd heads, nested remaining. Repair names the break. Never invents a rupee. */

import { nestedRemaining } from "../erp/atlas.ts";
import type { CellRow, GiEvent, GiLinkRow, HerdRow, LotRow } from "../erp/types.ts";
import type { LineageReport, WiringReport } from "./types.ts";

const GI_ORDER = ["mint", "intake", "settle"] as const;

function expectedGi(lot: LotRow): GiEvent[] {
  const gi = Boolean(lot.giMinted || lot.giMarker);
  if (lot.status === "settled" && gi) return ["mint", "intake", "settle"];
  if ((lot.status === "in_warehouse" || lot.status === "pledged" || lot.status === "listed") && gi) {
    return ["mint", "intake"];
  }
  if (gi) return ["mint"];
  return [];
}

function massBroken(lot: LotRow): string[] {
  const broken: string[] = [];
  if (lot.grams < 0) broken.push(`${lot.id}: minted mass cannot be negative.`);
  if (lot.remainingGrams < 0) broken.push(`${lot.id}: remaining cannot be negative.`);
  if (lot.remainingGrams > lot.grams) broken.push(`${lot.id}: remaining exceeds minted mass.`);
  return broken;
}

export function giLotLineage(lot: LotRow, chain: GiLinkRow[]): LineageReport {
  const links = chain.filter((g) => g.lotId === lot.id).sort((a, b) => a.seq - b.seq);
  const path = links.map((g) => g.event);
  const broken = massBroken(lot);
  const expected = expectedGi(lot);

  for (let i = 0; i < links.length; i++) {
    if (links[i].seq !== i + 1) broken.push(`${lot.id}: GI seq gap at ${links[i].seq}.`);
  }
  for (let i = 1; i < path.length; i++) {
    const prev = GI_ORDER.indexOf(path[i - 1] as (typeof GI_ORDER)[number]);
    const next = GI_ORDER.indexOf(path[i] as (typeof GI_ORDER)[number]);
    if (prev === -1 || next === -1 || next < prev) {
      broken.push(`${lot.id}: GI events out of order (${path.join(" → ")}).`);
      break;
    }
  }
  for (const event of expected) {
    if (!path.includes(event)) broken.push(`${lot.id}: missing GI ${event}.`);
  }

  const conserved = broken.length === 0;
  const reason = conserved
    ? expected.length
      ? `GI token ${lot.id} conserved ${path.join(" → ") || "mint"}. Remaining ${lot.remainingGrams} g. Rupee null.`
      : `Lot ${lot.id} is not a GI token. Remaining ${lot.remainingGrams} g conserved. Rupee null.`
    : `Broken GI token ${lot.id}. ${broken.join(" ")} Do not invent a rupee to close the gap.`;

  return {
    kind: "gi-lot",
    conserved,
    broken,
    path: path.length ? path : expected,
    remaining: lot.remainingGrams,
    rupee: null,
    reason,
  };
}

export function repairedGiPath(lot: LotRow, chain: GiLinkRow[]): string[] {
  const report = giLotLineage(lot, chain);
  if (report.conserved) return report.path;
  return expectedGi(lot);
}

export function herdCellLineage(herd: HerdRow[], cells: CellRow[]): LineageReport {
  const cellIds = new Set(cells.map((c) => c.id));
  const broken: string[] = [];
  const path: string[] = [];
  let remaining = 0;

  for (const row of herd) {
    remaining += row.head;
    path.push(`${row.cellName}:${row.kind}:${row.head}`);
    if (!cellIds.has(row.cellId)) broken.push(`${row.id}: herd points at unknown cell ${row.cellId}.`);
    if (row.head < 0) broken.push(`${row.id}: headcount cannot be negative.`);
    if (row.coverStatus === "bound" && !row.policyId) broken.push(`${row.id}: cover bound without a policy.`);
  }

  const conserved = broken.length === 0;
  return {
    kind: "herd-cell",
    conserved,
    broken,
    path,
    remaining,
    rupee: null,
    reason: conserved
      ? `Herd headcount ${remaining} conserved on the cell. Milk rupees stay missing. EMI not frozen.`
      : `Broken herd lineage. ${broken.join(" ")} Do not invent a litre or a rupee.`,
  };
}

export function nestedLineage(
  cells: CellRow[],
  lots: LotRow[],
): LineageReport {
  const nested = nestedRemaining(cells, lots);
  const broken: string[] = [];
  if (!nested.conserved) broken.push("Person remaining does not sum to home does not sum to village.");
  for (const cell of cells) {
    const lotSum = lots.filter((l) => l.cellId === cell.id).reduce((n, l) => n + l.remainingGrams, 0);
    if (lotSum !== cell.remainingGrams) {
      broken.push(`${cell.id}: cell remaining ${cell.remainingGrams} g ≠ lot sum ${lotSum} g.`);
    }
  }
  const conserved = broken.length === 0;
  return {
    kind: "person-home-village",
    conserved,
    broken,
    path: ["person", "home", "village"],
    remaining: nested.village.remainingGrams,
    rupee: null,
    reason: conserved
      ? `Nested remaining conserved: person = home = village = ${nested.village.remainingGrams} g. Rupee null.`
      : `Broken nested remaining. ${broken.join(" ")} Do not invent grams.`,
  };
}

export function repairLineages(input: {
  lots?: LotRow[];
  giChain?: GiLinkRow[];
  herd?: HerdRow[];
  cells?: CellRow[];
}): WiringReport {
  const lots = input.lots ?? [];
  const chain = input.giChain ?? [];
  const herd = input.herd ?? [];
  const cells = input.cells ?? [];
  const reports: LineageReport[] = [
    ...lots.map((lot) => giLotLineage(lot, chain)),
    herdCellLineage(herd, cells),
    nestedLineage(cells, lots),
  ];
  const broken = reports.flatMap((r) => r.broken);
  const repaired = lots
    .filter((lot) => !giLotLineage(lot, chain).conserved)
    .map((lot) => `${lot.id} expects ${repairedGiPath(lot, chain).join(" → ") || "no GI token"}`);
  return {
    reports,
    conserved: broken.length === 0,
    broken,
    repaired,
    rupee: null,
    livestockCash: "missing",
    githubMedical: "refused",
    afreraVet: "living",
  };
}
