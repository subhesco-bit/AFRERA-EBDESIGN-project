'use strict';

const { workflowRegistry } = require('./workflowDefinitionRegistry');
const { procurementFlowDefinition } = require('../services/flows/procurementFlow');
const { STATES: O2C_STATES, TRANSITIONS: O2C_TRANSITIONS, COMPENSATION: O2C_COMPENSATION } = require('../services/research-grade/ecommerceO2CStateMachine');
const { RMA_STATES, RMA_TRANSITIONS } = require('../services/ecommerce/returnsRmaStateMachine');
const { ISSUE_STATES, TYPE_SLA_HOURS } = require('../services/commerce/issueResolutionWorkflow');

function registerCanonicalWorkflows(registry = workflowRegistry) {
  const definitions = [];

  definitions.push(registry.register('PROCUREMENT_RFQ_TO_PAYMENT', {
    name: procurementFlowDefinition.name,
    description: procurementFlowDefinition.description,
    steps: procurementFlowDefinition.steps,
    triggers: procurementFlowDefinition.triggers,
    approvals: [{ id: 'authorize_payment', roles: ['finance_manager'], evidence: ['invoice','receipt','po'] }],
    exceptions: ['insufficient_bids','quality_rejection','invoice_mismatch','payment_hold'],
    owner: 'PROCUREMENT',
    source: 'backend/src/services/flows/procurementFlow.js',
  }));

  definitions.push(registry.register('ECOMMERCE_ORDER_TO_CASH', {
    name: 'Ecommerce Order to Cash',
    states: O2C_STATES,
    transitions: O2C_TRANSITIONS,
    initialState: 'draft',
    terminalStates: ['cancelled','refunded'],
    compensations: O2C_COMPENSATION,
    exceptions: ['cancel_requested','return_requested','failed'],
    owner: 'COMMERCE',
    source: 'backend/src/services/research-grade/ecommerceO2CStateMachine.js',
  }));

  definitions.push(registry.register('ECOMMERCE_RETURNS_RMA', {
    name: 'Ecommerce Returns and RMA',
    states: RMA_STATES,
    transitions: RMA_TRANSITIONS,
    initialState: 'requested',
    terminalStates: ['closed'],
    exceptions: ['rejected','qc_fail'],
    owner: 'COMMERCE',
    source: 'backend/src/services/ecommerce/returnsRmaStateMachine.js',
  }));

  definitions.push(registry.register('ISSUE_DISPUTE_RESOLUTION', {
    name: 'Issue and Dispute Resolution',
    states: Object.keys(ISSUE_STATES),
    transitions: ISSUE_STATES,
    initialState: 'open',
    terminalStates: ['closed','cancelled'],
    slaHours: TYPE_SLA_HOURS,
    approvals: [{ id: 'arbitration', roles: ['platform_operator','authorized_arbitrator'] }],
    exceptions: ['escalated','arbitration'],
    owner: 'CRM_SERVICE',
    source: 'backend/src/services/commerce/issueResolutionWorkflow.js',
  }));

  return definitions;
}

module.exports = { registerCanonicalWorkflows };
