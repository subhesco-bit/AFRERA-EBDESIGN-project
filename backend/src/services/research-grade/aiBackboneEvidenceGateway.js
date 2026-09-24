/**
 * AI Backbone ↔ Real engines gateway with evidence records
 * Parallel to enterprise AI integration: provenance, model/policy version,
 * confidence, assumptions, action boundary, human-approval status.
 *
 * Rule: hardcoded or random responses are not production AI — this gateway
 * always attaches evidence and can route to domain engines.
 */

'use strict';

const { randomUUID } = require('crypto');
const subsidy = require('./subsidyEligibilityEngine');
const logistics = require('./logisticsDecisionEngine');
const mep = require('./mepEngineeringEngine');
const { EcommerceO2CStateMachine } = require('./ecommerceO2CStateMachine');

const POLICY_VERSION = 'afrera-ai-policy-2026.09';
const GATEWAY_VERSION = '1.0.0-research';

function evidenceBase({ engine, input, output, confidence, assumptions = [] }) {
  return {
    evidence_id: randomUUID(),
    gateway_version: GATEWAY_VERSION,
    policy_version: POLICY_VERSION,
    engine,
    input_hash: simpleHash(JSON.stringify(input || {})),
    confidence: confidence ?? output?.confidence ?? null,
    assumptions,
    provenance: `research-grade:${engine}`,
    citations: output?.basis ? [output.basis] : [],
    action_boundary: output?.safety_floor || output?.advisory
      ? 'advisory_only'
      : 'system_of_record_candidate',
    human_approval_status: 'not_required_for_advisory',
    outcome: null,
    created_at: new Date().toISOString(),
  };
}

function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `h${(h >>> 0).toString(16)}`;
}

async function route(capability, data = {}) {
  switch (capability) {
    case 'subsidy_extract': {
      const output = subsidy.extractAll(data.farmer || data, data.as_of);
      return {
        success: true,
        capability,
        result: output,
        evidence: evidenceBase({
          engine: 'subsidyEligibilityEngine',
          input: data,
          output,
          confidence: output.confidence,
          assumptions: ['Scheme parameters illustrative where noted; GOs override'],
        }),
      };
    }
    case 'subsidy_list':
      return {
        success: true,
        capability,
        result: { schemes: subsidy.listSchemes() },
        evidence: evidenceBase({ engine: 'subsidyEligibilityEngine', input: {}, output: {}, confidence: 1 }),
      };
    case 'logistics_decide': {
      const output = logistics.decide(data.shipment || data);
      return {
        success: true,
        capability,
        result: output,
        evidence: evidenceBase({
          engine: 'logisticsDecisionEngine',
          input: data,
          output,
          confidence: output.confidence,
          assumptions: ['Static cost/CO2 coefficients; no live carrier rates'],
        }),
      };
    }
    case 'mep_package': {
      const output = mep.mepPackage(data);
      return {
        success: true,
        capability,
        result: output,
        evidence: evidenceBase({
          engine: 'mepEngineeringEngine',
          input: data,
          output,
          confidence: output.confidence,
          assumptions: ['First-pass W/m² and fixture units'],
        }),
      };
    }
    case 'ecommerce_o2c_transition': {
      const sm = new EcommerceO2CStateMachine(data.order || {});
      const output = data.to
        ? sm.transition(data.to, data.event || {})
        : sm.snapshot();
      return {
        success: true,
        capability,
        result: { ...output, snapshot: sm.snapshot() },
        evidence: evidenceBase({
          engine: 'ecommerceO2CStateMachine',
          input: data,
          output,
          confidence: 1,
          assumptions: [],
        }),
      };
    }
    case 'ecommerce_o2c_advance': {
      const sm = new EcommerceO2CStateMachine(data.order || {});
      const output = sm.advanceTo(data.target || 'completed', data.event || {});
      return {
        success: true,
        capability,
        result: output,
        evidence: evidenceBase({
          engine: 'ecommerceO2CStateMachine',
          input: data,
          output,
          confidence: output.reached ? 1 : 0.7,
        }),
      };
    }
    case 'capabilities':
      return {
        success: true,
        capability,
        result: {
          implemented: [
            'subsidy_extract',
            'subsidy_list',
            'logistics_decide',
            'mep_package',
            'ecommerce_o2c_transition',
            'ecommerce_o2c_advance',
          ],
          connected_engines: [
            'subsidyEligibilityEngine',
            'logisticsDecisionEngine',
            'mepEngineeringEngine',
            'ecommerceO2CStateMachine',
          ],
          policy_version: POLICY_VERSION,
          gateway_version: GATEWAY_VERSION,
          enterprise_parallel: true,
          rule: 'Evidence record required on every decision path',
        },
      };
    default:
      return {
        success: false,
        error: 'Unknown capability',
        capability,
        evidence: evidenceBase({
          engine: 'gateway',
          input: data,
          output: {},
          confidence: 0,
        }),
      };
  }
}

module.exports = {
  route,
  evidenceBase,
  POLICY_VERSION,
  GATEWAY_VERSION,
};
