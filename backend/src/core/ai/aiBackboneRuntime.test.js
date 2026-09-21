'use strict';

const { AGENTS, AUTONOMY, enforcePolicy, buildPlan } = require('./aiBackboneRuntime');

describe('AI Backbone Runtime', () => {
  test('registers corporate and rural agents', () => {
    expect(AGENTS.finance.domain).toBe('finance');
    expect(AGENTS.rural_economy.domain).toBe('rural_economy');
    expect(AGENTS.metro_commerce.domain).toBe('metro_commerce');
  });

  test('blocks high-impact financial actions without human approval', () => {
    const policy = enforcePolicy(AGENTS.finance, {
      action: 'release_payment',
      autonomyLevel: AUTONOMY.EXECUTE_LOW_RISK,
    });
    expect(policy.allowed).toBe(false);
    expect(policy.requiresHumanApproval).toBe(true);
  });

  test('keeps medical and biological agents recommendation-only', () => {
    const policy = enforcePolicy(AGENTS.medical_biological, {
      action: 'recommend',
      autonomyLevel: AUTONOMY.EXECUTE_LOW_RISK,
    });
    expect(policy.allowed).toBe(false);
    expect(policy.level).toBe(AUTONOMY.RECOMMEND);
    expect(policy.requiresHumanApproval).toBe(true);
  });

  test('creates an observable plan before execution', () => {
    const plan = buildPlan(AGENTS.supply_chain, {
      agentId: 'supply_chain',
      objective: 'optimise village-to-metro fulfilment',
      execute: true,
      autonomyLevel: AUTONOMY.EXECUTE_LOW_RISK,
    });
    expect(plan.planId).toMatch(/^plan_/);
    expect(plan.steps.map(step => step.type)).toEqual(['observe','reason','validate','recommend','execute']);
  });
});
