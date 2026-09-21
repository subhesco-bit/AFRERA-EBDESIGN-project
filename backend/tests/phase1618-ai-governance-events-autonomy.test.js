const governance = require('../src/services/aiGovernanceService');
const autonomy = require('../src/services/boundedAutonomyService');
const events = require('../src/services/aiEventOrchestratorService');

describe('Phases 16-18 AI control plane', () => {
  test('low-risk read/recommendation is allowed without approval', () => {
    const result = governance.evaluate({ action: 'forecast.refresh', domain: 'erp' });
    expect(result.decision).toBe('allowed');
    expect(result.approvalRequired).toBe(false);
  });

  test('high-impact financial action requires approval', () => {
    const result = governance.evaluate({ action: 'payment.release', domain: 'finance' });
    expect(result.decision).toBe('approval_required');
    expect(result.approvalRequired).toBe(true);
  });

  test('critical action is blocked', () => {
    const result = governance.evaluate({ action: 'critical.system.override', requestedRisk: 'critical' });
    expect(result.decision).toBe('blocked');
  });

  test('event handlers can be registered and invoked', async () => {
    events.register('phase18.test', async event => ({ correlationId: event.correlationId }));
    const result = await events.publish({ eventType: 'phase18.test', aggregateType: 'test', aggregateId: '1' });
    expect(result.status).toBe('processed');
    expect(result.handled).toBe(true);
  });

  test('unsafe autonomous action requires approval', () => {
    const result = autonomy.propose({ agentName: 'test-agent', actionType: 'payment.release' });
    return result.then(value => {
      expect(value.approvalRequired).toBe(true);
      expect(value.status).toBe('awaiting_approval');
    });
  });
});
