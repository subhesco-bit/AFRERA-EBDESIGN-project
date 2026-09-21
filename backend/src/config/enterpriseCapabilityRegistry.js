'use strict';

const CAPABILITIES = [
  { domain: 'erp_accounting', examples: ['NetSuite', 'SAP', 'Dynamics', 'Tally'], mode: 'approval-gated-write', records: ['vendor', 'inventory', 'invoice', 'journal', 'tax'] },
  { domain: 'banking_funding', examples: ['bank APIs', 'account aggregation', 'lending portals'], mode: 'consent-and-approval', records: ['bank passport', 'application', 'offer', 'repayment'] },
  { domain: 'insurance', examples: ['insurer and broker APIs'], mode: 'licensed-human-approval', records: ['quote', 'policy', 'endorsement', 'claim'] },
  { domain: 'project_management', examples: ['monday.com', 'Linear', 'Asana', 'Smartsheet'], mode: 'approval-gated-write', records: ['project', 'task', 'milestone', 'approval'] },
  { domain: 'crm_commerce', examples: ['HubSpot', 'Zoho CRM', 'marketplace adapters'], mode: 'approval-gated-write', records: ['customer', 'lead', 'order', 'support case'] },
  { domain: 'analytics', examples: ['Mixpanel', 'warehouse/BI adapters'], mode: 'read-preferred', records: ['event', 'metric', 'funnel', 'forecast'] },
  { domain: 'documents_communication', examples: ['Drive', 'Box', 'email', 'Teams', 'Slack'], mode: 'least-privilege', records: ['document', 'message', 'notification', 'approval evidence'] },
  { domain: 'health_coding', examples: ['terminology and payer adapters'], mode: 'qualified-human-review', records: ['encounter', 'code suggestion', 'claim evidence'] },
];

function getEnterpriseCapabilityPolicy() {
  return {
    selection: 'Use the smallest connected adapter set that covers the workflow; never call every provider for the same action.',
    defaults: ['prefer authoritative system of record', 'read before write', 'idempotency key on financial writes', 'explicit approval for external mutation', 'audit every handoff', 'graceful fallback when an adapter is unavailable'],
    capabilities: CAPABILITIES,
  };
}

module.exports = { CAPABILITIES, getEnterpriseCapabilityPolicy };
