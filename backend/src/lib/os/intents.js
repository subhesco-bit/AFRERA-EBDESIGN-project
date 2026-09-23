'use strict';
/** Need-based navigation. The problem is the door, not the module name.
 * Ported from pine-shadow src/lib/os/intents.ts */

const NEED_INTENTS = [
  { id: 'sell-crop', label: 'Sell crop', problem: 'Offtake at a declared ₹/kg.', href: '/trade', workflow: 'offtake-settle', organ: 'orders' },
  { id: 'mint-harvest', label: 'Mint harvest', problem: 'Name a cell and mint one lot.', href: '/lots', workflow: 'harvest-mint', organ: 'lot' },
  { id: 'store-lot', label: 'Store a lot', problem: 'The same body inwards at the godown.', href: '/warehouse', workflow: 'warehouse-intake', organ: 'warehouse' },
  { id: 'claim-loss', label: 'Claim spoilage', problem: 'Cut remaining grams. Do not invent kWh.', href: '/warehouse', workflow: null, organ: 'rcop' },
  { id: 'see-books', label: 'See the books', problem: 'Cells, remaining, farmgate, journal.', href: '/', workflow: null, organ: 'erp' },
  { id: 'cover-gap', label: 'Cover at godown', problem: 'Langthasa master policy. Premium unknown.', href: '/warehouse', workflow: null, organ: 'insurance' },
  { id: 'claim-weather', label: 'Weather claim', problem: 'Open a claim window. Do not freeze EMI.', href: '/warehouse', workflow: 'domain-advise', organ: 'soil' },
  { id: 'scheme-blood', label: 'Scheme eligibility', problem: 'Computed on the cell. Amount blank.', href: '/ledger', workflow: null, organ: 'finance' },
  { id: 'next-season', label: 'Offer next Magh', problem: 'Last season kg. Price blank until declared.', href: '/trade', workflow: null, organ: 'contract' },
  { id: 'consult-nerve', label: 'Ask the nerve', problem: 'Library first. No rupee write.', href: '/nerve', workflow: 'nerve-consult', organ: 'ai' },
  { id: 'ask-brain', label: 'Ask the brain', problem: 'Five tissues. One decision. Clerk still writes remaining.', href: '/brain', workflow: null, organ: 'ai' },
  { id: 'read-charter', label: 'Read the laws', problem: 'L1–L12. Remaining, declared ₹, human command.', href: '/charter', workflow: null, organ: 'module' },
  { id: 'see-flows', label: 'Walk the flows', problem: 'Strategy, payment, material, command, supply chain as living charts.', href: '/flows', workflow: null, organ: 'spine' },
  { id: 'see-atlas', label: 'See the ERP atlas', problem: '32 SAP analog families classified. Not Oracle/SAP parity. Finance/procure named missing.', href: '/platform', workflow: null, organ: 'erp' },
  { id: 'ack-ai', label: 'Ack the AI', problem: '35 AI families classified. Five tissues decide. GitHub plugs stay 0. Not AI parity.', href: '/brain', workflow: null, organ: 'ai' },
  { id: 'code-herd', label: 'Code the herd', problem: 'AFRERA-VET on village animals. August AI proposes. Clerk confirms heads. Human ICD refused.', href: '/vet', workflow: 'code-herd', organ: 'livestock' },
  { id: 'book-muscle', label: 'Book village muscle', problem: 'Hours on cold, mill, process, pack, labs. Rent undeclared. GST invoice refused.', href: '/share', workflow: 'book-muscle', organ: 'shared' },
  { id: 'trace-organic', label: 'Trace organic', problem: 'PGS/NPOP on the lot body. GST pack named. Certificate rupee refused.', href: '/share', workflow: 'book-muscle', organ: 'trace' },
  { id: 'react-now', label: 'React now', problem: 'Issue arose. Correct relax, not panic. EMI not frozen.', href: '/body', workflow: 'climate-reflex', organ: 'reflex' },
  { id: 'find-loan', label: 'Find a loan', problem: 'Refuse. No underwriting. No invented score.', href: '/os', workflow: null, organ: 'finance' },
  { id: 'file-grievance', label: 'File a grievance', problem: 'Village exception → ack → evidence. No fake close.', href: '/os', workflow: null, organ: 'spine' },
  { id: 'book-transport', label: 'Book transport', problem: 'Freight is declared (zero allowed). Not a tower.', href: '/trade', workflow: null, organ: 'logistics' },
];

function rankIntents(books) {
  if (!books) return NEED_INTENTS;
  const minted = books.lots.filter((l) => l.status === 'minted').length;
  const remaining = books.lots.some((l) => l.remainingGrams > 0);
  const open = books.orders.some((o) => o.status === 'open');
  const scored = NEED_INTENTS.map((i) => {
    let n = 0;
    if (i.id === 'mint-harvest' && books.cells.length > 0) n += 2;
    if (i.id === 'store-lot' && minted > 0) n += 4;
    if (i.id === 'sell-crop' && remaining) n += 3;
    if (i.id === 'see-books') n += 1;
    if (i.id === 'see-atlas') n += 2;
    if (i.id === 'ack-ai') n += 2;
    if (i.id === 'code-herd' && (books.herd ?? []).length) n += 4;
    if (i.id === 'book-muscle') n += 3;
    if (i.id === 'trace-organic' && remaining) n += 3;
    if (i.id === 'react-now' && ((books.weatherAlerts ?? []).some((a) => a.claimOpen) || (books.energyWindows ?? []).some((w) => w.active && w.status === 'outage'))) n += 5;
    if (i.id === 'claim-loss' && remaining) n += 2;
    if (i.id === 'next-season' && books.orders.some((o) => o.status === 'settled')) n += 3;
    if (i.id === 'cover-gap') n += 1;
    if (open && i.id === 'sell-crop') n += 2;
    if (i.id === 'file-grievance' && open) n += 2;
    if (i.id === 'find-loan') n -= 2;
    return { i, n };
  });
  scored.sort((a, b) => b.n - a.n);
  return scored.map((s) => s.i);
}

module.exports = { NEED_INTENTS, rankIntents };
