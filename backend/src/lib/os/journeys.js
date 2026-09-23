'use strict';
/** Sector journeys. Agriculture is living. Others are named, not cloned.
 * Ported from pine-shadow src/lib/os/journeys.ts */

const agri = [
  { id: 'plot', name: 'Plot', status: 'living', href: '/cells', organ: 'crop' },
  { id: 'plan', name: 'Plan', status: 'partial', href: '/cells', organ: 'crop' },
  { id: 'finance', name: 'Finance', status: 'missing', href: '/ledger', organ: 'finance' },
  { id: 'procure', name: 'Procure', status: 'missing', href: '/os', organ: 'orders' },
  { id: 'operate', name: 'Operate', status: 'partial', href: '/lots', organ: 'farmer' },
  { id: 'monitor', name: 'Monitor', status: 'partial', href: '/pulse', organ: 'spine' },
  { id: 'harvest', name: 'Harvest', status: 'living', href: '/lots', organ: 'lot' },
  { id: 'grade', name: 'Grade', status: 'partial', href: '/platform', organ: 'lot' },
  { id: 'store', name: 'Store', status: 'living', href: '/warehouse', organ: 'warehouse' },
  { id: 'sell', name: 'Sell', status: 'living', href: '/trade', organ: 'orders' },
  { id: 'settle', name: 'Settle', status: 'living', href: '/trade', organ: 'rupee' },
];

function named(id, sector, thesis) {
  return { id, sector, status: 'named', thesis, steps: [{ id: `${id}-door`, name: 'Do not clone agriculture', status: 'missing', href: '/os', organ: 'os' }] };
}

const SECTOR_JOURNEYS = [
  { id: 'agriculture', sector: 'Agriculture lifecycle', status: 'living', thesis: 'Plot → harvest → godown → offtake → settle. Finance and procure stay missing. No invented ₹.', steps: agri },
  named('marketplace', 'Marketplace', 'Listing is born from harvest. Rank on remaining + FUS, never invented price.'),
  { id: 'travel', sector: 'Village remaining journey', status: 'living', thesis: 'Remaining grams move plot → harvest → godown → kitchen → next Magh. Tourism itinerary refused. Budget undeclared.', steps: [
    { id: 'v-plot', name: 'Plot', status: 'living', href: '/cells', organ: 'crop' },
    { id: 'v-harvest', name: 'Harvest', status: 'living', href: '/lots', organ: 'lot' },
    { id: 'v-store', name: 'Godown', status: 'living', href: '/warehouse', organ: 'warehouse' },
    { id: 'v-kitchen', name: 'Kitchen', status: 'living', href: '/trade', organ: 'demand' },
    { id: 'v-next', name: 'Next Magh', status: 'partial', href: '/trade', organ: 'contract' },
    { id: 'v-tourism', name: 'Tourism itinerary', status: 'missing', href: '/os', organ: 'demand' },
  ] },
  { id: 'insurance', sector: 'Insurance', status: 'living', thesis: 'Cover binds. Claim files. Payout and premium stay undeclared. Survey named.', steps: [
    { id: 'cover', name: 'Cover', status: 'living', href: '/warehouse', organ: 'insurance' },
    { id: 'claim', name: 'Claim', status: 'living', href: '/os', organ: 'insurance' },
    { id: 'survey', name: 'Survey', status: 'missing', href: '/os', organ: 'insurance' },
  ] },
  { id: 'banking', sector: 'Banking', status: 'named', thesis: 'No invented credit score. Pledge gate lives. Underwriting stays missing.', steps: [{ id: 'banking-door', name: 'Do not invent a score', status: 'missing', href: '/ledger', organ: 'finance' }] },
  { id: 'logistics', sector: 'Logistics', status: 'living', thesis: 'Freight is declared. PoD is a clerk fact. ETA refused.', steps: [
    { id: 'freight', name: 'Freight', status: 'living', href: '/trade', organ: 'logistics' },
    { id: 'pod', name: 'Proof of delivery', status: 'living', href: '/os', organ: 'logistics' },
    { id: 'eta', name: 'ETA', status: 'missing', href: '/os', organ: 'logistics' },
  ] },
  { id: 'government', sector: 'Government schemes', status: 'living', thesis: 'Effective-dated eligibility. Amount blank. Gazette twin refused. Policy lab what-if lives.', steps: [
    { id: 'elig', name: 'Eligibility', status: 'living', href: '/ledger', organ: 'scheme' },
    { id: 'amount', name: 'Amount', status: 'missing', href: '/os', organ: 'scheme' },
    { id: 'gazette', name: 'Gazette twin', status: 'missing', href: '/os', organ: 'scheme' },
  ] },
  { id: 'engineering', sector: 'Engineering', status: 'living', thesis: 'BOQ stamp on declared qty+unit+standard+engineer. CFD refused. Amount only if rate declared.', steps: [
    { id: 'boq', name: 'BOQ stamp', status: 'living', href: '/os', organ: 'shared' },
    { id: 'cfd', name: 'CFD', status: 'missing', href: '/os', organ: 'shared' },
    { id: 'bim', name: 'BIM', status: 'missing', href: '/os', organ: 'shared' },
  ] },
  named('health', 'Health', 'Clinical safety boundary. Do not infer health. Human ICD is the wrong genome for a village herd.'),
  { id: 'livestock', sector: 'Livestock / veterinary', status: 'living', thesis: 'AFRERA-VET codes village animals. Headcount conserved. Milk rupees missing. Human ICD refused.', steps: [
    { id: 'vet-code', name: 'Veterinary code', status: 'living', href: '/vet', organ: 'livestock' },
    { id: 'vet-herd', name: 'Herd on the cell', status: 'living', href: '/cells', organ: 'livestock' },
    { id: 'vet-cover', name: 'Herd cover', status: 'partial', href: '/warehouse', organ: 'insurance' },
    { id: 'vet-cash', name: 'Milk rupees', status: 'missing', href: '/vet', organ: 'finance' },
    { id: 'vet-icd', name: 'Human ICD', status: 'missing', href: '/vet', organ: 'ai' },
  ] },
  { id: 'enterprise', sector: 'Enterprise ERP', status: 'living', thesis: 'Village journal is the GL. CoA and period close live. GST still named.', steps: [
    { id: 'journal', name: 'Journal', status: 'living', href: '/platform', organ: 'erp' },
    { id: 'period', name: 'Period close', status: 'living', href: '/os', organ: 'erp' },
    { id: 'gst', name: 'GST', status: 'missing', href: '/share', organ: 'erp' },
  ] },
  { id: 'shared-infra', sector: 'Shared village muscle', status: 'living', thesis: 'Hours conserved on FPO muscle. Organic trace lives. GST invoice missing. Subsidy amount blank. Rental rupees missing.', steps: [
    { id: 'share-book', name: 'Book hours', status: 'living', href: '/share', organ: 'shared' },
    { id: 'share-process', name: 'Process unit', status: 'living', href: '/share', organ: 'processing' },
    { id: 'share-pack', name: 'Pack unit', status: 'living', href: '/share', organ: 'processing' },
    { id: 'share-lab', name: 'Mobile labs', status: 'living', href: '/share', organ: 'shared' },
    { id: 'share-cold', name: 'Cold bay', status: 'living', href: '/share', organ: 'warehouse' },
    { id: 'share-organic', name: 'Organic trace', status: 'living', href: '/share', organ: 'trace' },
    { id: 'share-gst', name: 'GST invoice', status: 'missing', href: '/share', organ: 'erp' },
    { id: 'share-subsidy', name: 'Subsidy amount', status: 'missing', href: '/share', organ: 'scheme' },
    { id: 'share-rent', name: 'Rental rupees', status: 'missing', href: '/share', organ: 'finance' },
  ] },
];

const LIVING_EDGES = { plot: ['plan', 'harvest'], plan: ['harvest'], harvest: ['grade', 'store'], grade: ['store'], store: ['sell'], sell: ['settle'] };

function canAdvance(from, to) {
  return (LIVING_EDGES[from] ?? []).includes(to);
}

function livingAgriculture() {
  return agri.filter((s) => s.status === 'living');
}

module.exports = { SECTOR_JOURNEYS, canAdvance, livingAgriculture };
