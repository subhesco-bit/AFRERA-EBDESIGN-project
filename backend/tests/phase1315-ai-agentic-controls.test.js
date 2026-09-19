'use strict';

const brain = require('../src/services/ai/aiBrainService');
const intelligence = require('../src/services/ai/aiOperationIntelligenceService');
const agents = require('../src/services/ai/aiAgentService');

describe('Phases 13-15 AI control plane', () => {
  test('operational intelligence detects supply gaps and low stock', () => {
    const result = intelligence.analyze({ demand: 100, supply: 70, stock: 20, reorderPoint: 50 });
    expect(result.findings.map(x => x.code)).toEqual(expect.arrayContaining(['SUPPLY_GAP', 'LOW_STOCK']));
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  test('brain requires approval for high-impact execution', () => {
    const result = brain.decide({
      objective: 'settlement control',
      recommendations: [{ action: 'approve_payment' }],
      context: { mode: 'execute' },
    });
    expect(result.decision).toBe('approval_required');
    expect(result.policy.violations.map(v => v.code)).toContain('APPROVAL_REQUIRED');
  });

  test('low-risk bounded agent can execute with a registered handler', async () => {
    const name = 'test-bounded-agent';
    agents.registerAgent({
      name,
      capabilities: ['optimize_allocation'],
      handler: async () => ({ ok: true }),
    });
    const result = await agents.runAgent(name, {
      objective: 'optimize village allocation',
      recommendations: [{ action: 'optimize_allocation' }],
    });
    expect(result.status).toBe('completed');
    expect(result.result.ok).toBe(true);
  });

  test('high-impact agent stops before execution without approval', async () => {
    const name = 'test-controlled-agent';
    agents.registerAgent({
      name,
      capabilities: ['approve_payment'],
      handler: async () => ({ shouldNotRun: true }),
    });
    const result = await agents.runAgent(name, {
      objective: 'payment decision',
      recommendations: [{ action: 'approve_payment' }],
    });
    expect(result.status).toBe('awaiting_approval');
    expect(result.result).toBeUndefined();
  });
});
