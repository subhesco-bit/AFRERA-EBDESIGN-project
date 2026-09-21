'use strict';

const { boundedInteger, getAIRuntimePolicy, outputTokenLimit } = require('../config/aiRuntimePolicy');
const { getEnterpriseCapabilityPolicy } = require('../config/enterpriseCapabilityRegistry');

describe('AI and enterprise runtime defaults', () => {
  test('bounds unsafe token configuration without reducing the quality floor', () => {
    expect(boundedInteger('99999', 320, 64, 2000)).toBe(2000);
    expect(boundedInteger('1', 320, 64, 2000)).toBe(64);
    expect(outputTokenLimit('UNCONFIGURED_TEST', 320)).toBe(320);
  });

  test('requires selective, approval-gated enterprise adapter usage', () => {
    const policy = getEnterpriseCapabilityPolicy();
    expect(policy.capabilities.some((item) => item.domain === 'erp_accounting')).toBe(true);
    expect(policy.capabilities.some((item) => item.domain === 'project_management')).toBe(true);
    expect(policy.selection).toMatch(/smallest connected adapter set/i);
    expect(getAIRuntimePolicy().quality_gates).toContain('human approval for regulated actions');
  });
});
