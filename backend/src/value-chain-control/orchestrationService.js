/**
 * Orchestration compose — builds a control-plane view for a case.
 * Does not invent economics; only runs engines on supplied inputs.
 */

'use strict';

const caseService = require('./caseService');
const gateEngine = require('./gateEngine');
const assertionService = require('./assertionService');
const calculationRegistry = require('./calculationRegistry');
const massBalanceEngine = require('./massBalanceEngine');
const priceWaterfallEngine = require('./priceWaterfallEngine');
const adapters = require('./adapters');

function getCapabilities() {
  return {
    planVersion: '0.1-skeleton',
    role: 'Value-Chain Execution Control Plane (kernel)',
    aiBoundary: 'Generative AI must not write numeric assertions; positioning/imagery only',
    evidenceClasses: assertionService.CLASSES,
    calculations: calculationRegistry.listDefinitions(),
    adapters: ['fpo', 'warehouse-receipts', 'trade-escrow', 'mep-design'],
    endpoints: { base: '/api/v1/value-chain-control' },
    status: 'SKELETON — wire LIVE adapters and UI next',
  };
}

async function composeCaseView(caseId, {
  deliveredPricePerKg,
  priceDeductions,
  harvestQty,
  massLossStages,
  adapterIds,
} = {}) {
  const vcCase = await caseService.getCase(caseId);
  if (!vcCase) throw new Error('Case not found');

  const [nodes, gates, assertions, links, massLines] = await Promise.all([
    caseService.listNodes(vcCase.id),
    gateEngine.listGates(vcCase.id),
    assertionService.listAssertions(vcCase.id),
    caseService.listLinks(vcCase.id),
    massBalanceEngine.listLines(vcCase.id).catch(() => []),
  ]);

  let priceWaterfall = null;
  if (deliveredPricePerKg != null) {
    priceWaterfall = priceWaterfallEngine.buildWaterfall(deliveredPricePerKg, priceDeductions || []);
  }

  let massProjection = null;
  if (harvestQty != null && Array.isArray(massLossStages)) {
    massProjection = massBalanceEngine.projectChain(harvestQty, massLossStages);
  }

  const adapterResults = {};
  const ids = adapterIds || {};
  adapterResults.fpo = await adapters.fpoAdapter({ fpoId: ids.fpoId || vcCase.fpo_id });
  adapterResults.warehouseReceipt = await adapters.warehouseReceiptAdapter({ receiptId: ids.receiptId });
  adapterResults.tradeEscrow = await adapters.tradeEscrowAdapter({ escrowId: ids.escrowId });
  if (ids.facilityType) {
    adapterResults.mep = await adapters.engineeringMepAdapter({
      facilityType: ids.facilityType,
      capacityInputs: ids.capacityInputs,
    });
  }

  return {
    case: vcCase,
    nodes,
    gates,
    assertions,
    links,
    massBalanceLines: massLines,
    massProjection,
    priceWaterfall,
    adapters: adapterResults,
    deepLinks: adapters.specialistDeepLinks(vcCase.id),
    integrity: {
      rule: 'No number without evidenceClass and source or calculationId',
      aiNumericWrites: 'FORBIDDEN',
    },
  };
}

module.exports = {
  getCapabilities,
  composeCaseView,
  caseService,
  gateEngine,
  assertionService,
  calculationRegistry,
  massBalanceEngine,
  priceWaterfallEngine,
  adapters,
};
