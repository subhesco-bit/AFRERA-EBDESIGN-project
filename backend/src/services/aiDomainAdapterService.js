'use strict';

const aiGateway = require('./aiGatewayService');

const ADAPTERS = Object.freeze({
  accounting: { moduleId: 'accounting', capability: 'accounting-review' },
  gst: { moduleId: 'gst', capability: 'gst-compliance-review' },
  logistics: { moduleId: 'logistics', capability: 'shipment-and-route-review' },
  reverseLogistics: { moduleId: 'reverse-logistics', capability: 'perishable-inbound-corridor-review' },
  warehouse: { moduleId: 'warehouse', capability: 'inventory-and-warehouse-review' },
  storage: { moduleId: 'storage', capability: 'storage-allocation-review' },
  coldStorage: { moduleId: 'cold-storage', capability: 'cold-chain-booking-review' },
  farmerAdvisor: { moduleId: 'farmer-advisor', capability: 'farmer-advisory' },
  naturalTherapy: { moduleId: 'natural-therapy', capability: 'wellness-education' },
  chef: { moduleId: 'recipe-intelligence', capability: 'master-chef-recipe-review' },
  nutrition: { moduleId: 'nutrition', capability: 'nutrition-calculation-review' },
  image: { moduleId: 'image-ai', capability: 'image-analysis-review' },
  content: { moduleId: 'content-ai', capability: 'content-and-slogan-review' },
  multilingual: { moduleId: 'multilingual', capability: 'translation-review' },
  sms: { moduleId: 'sms', capability: 'farmer-sms-message-review' },
});

function normalizeDomain(domain) {
  const key = String(domain || '').trim();
  if (!ADAPTERS[key]) {
    const error = new Error(`Unknown AI adapter: ${key}`);
    error.code = 'UNKNOWN_AI_ADAPTER';
    throw error;
  }
  return key;
}

async function explain(domain, operation, data, context = {}) {
  const key = normalizeDomain(domain);
  const adapter = ADAPTERS[key];
  const safeOperation = String(operation || 'review').slice(0, 120);
  return aiGateway.run({
    moduleId: adapter.moduleId,
    capability: adapter.capability,
    prompt: `Review operation ${safeOperation}. Explain the deterministic result, identify missing evidence, and list human-review actions. Do not change or execute it. DATA_JSON: ${JSON.stringify(data)}`,
    context: { ...context, adapter: key, operation: safeOperation },
  });
}

function listAdapters() {
  return Object.entries(ADAPTERS).map(([key, value]) => ({ key, ...value, execution: 'explanation-only' }));
}

module.exports = { ADAPTERS, explain, listAdapters, normalizeDomain };
