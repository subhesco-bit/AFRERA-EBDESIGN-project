/**
 * Specialist adapters — contracts only + LIVE hooks where modules exist.
 * STUB adapters return { status: 'STUB'|'LIVE', ... } honestly.
 */

'use strict';

async function tryRequire(path) {
  try {
    return require(path);
  } catch {
    return null;
  }
}

async function fpoAdapter({ fpoId }) {
  const svc = await tryRequire('../../services/legacy/fpoOperationsService');
  if (!svc || !fpoId) return { status: 'STUB', system: 'fpo-operations', note: 'Provide fpoId or service missing' };
  try {
    const fpo = await svc.getFpo(fpoId);
    return { status: fpo ? 'LIVE' : 'MISSING', system: 'fpo-operations', data: fpo };
  } catch (e) {
    return { status: 'ERROR', system: 'fpo-operations', error: e.message };
  }
}

async function warehouseReceiptAdapter({ receiptId }) {
  const svc = await tryRequire('../../services/legacy/warehouseReceiptService');
  if (!svc || !receiptId) return { status: 'STUB', system: 'warehouse-receipts' };
  try {
    const wr = await svc.getReceipt(receiptId);
    return { status: wr ? 'LIVE' : 'MISSING', system: 'warehouse-receipts', data: wr };
  } catch (e) {
    return { status: 'ERROR', system: 'warehouse-receipts', error: e.message };
  }
}

async function tradeEscrowAdapter({ escrowId }) {
  const svc = await tryRequire('../../services/legacy/multiPartyEscrowService');
  if (!svc || !escrowId) return { status: 'STUB', system: 'trade-escrow' };
  try {
    const esc = await svc.getEscrow(escrowId);
    return { status: esc ? 'LIVE' : 'MISSING', system: 'trade-escrow', data: esc };
  } catch (e) {
    return { status: 'ERROR', system: 'trade-escrow', error: e.message };
  }
}

async function engineeringMepAdapter({ facilityType, capacityInputs }) {
  const svc = await tryRequire('../../services/legacy/mepDesignService');
  if (!svc) return { status: 'STUB', system: 'mep-design' };
  try {
    if (!facilityType) return { status: 'STUB', system: 'mep-design', note: 'facilityType required' };
    const plan = await svc.buildMepDesignPlan({ facilityType, capacityInputs: capacityInputs || {} });
    return { status: 'LIVE', system: 'mep-design', data: plan };
  } catch (e) {
    return { status: 'ERROR', system: 'mep-design', error: e.message };
  }
}

function specialistDeepLinks(caseId) {
  return [
    { section: 'fpo', label: 'FPO Operations', href: '/fpo-operations', context: { case_id: caseId } },
    { section: 'warehouse', label: 'Warehouse Receipts', href: '/warehouse-receipts', context: { case_id: caseId } },
    { section: 'escrow', label: 'Trade Escrow', href: '/trade-escrow', context: { case_id: caseId } },
    { section: 'cold', label: 'Cold Storage', href: '/cold-storage', context: { case_id: caseId } },
    { section: 'engineering', label: 'MEP Design', href: '/mep-design', context: { case_id: caseId } },
    { section: 'marketplace', label: 'Marketplace', href: '/marketplace', context: { case_id: caseId } },
    { section: 'insurance', label: 'Insurance', href: '/insurance', context: { case_id: caseId } },
    { section: 'schemes', label: 'Government Schemes', href: '/government-schemes', context: { case_id: caseId } },
  ];
}

module.exports = {
  fpoAdapter,
  warehouseReceiptAdapter,
  tradeEscrowAdapter,
  engineeringMepAdapter,
  specialistDeepLinks,
};
