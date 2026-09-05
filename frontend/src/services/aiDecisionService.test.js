import { aiDecisionService } from './aiDecisionService';

describe('aiDecisionService', () => {
  it('builds a fallback decision queue for a module', () => {
    const decisions = aiDecisionService.getFallbackDecisions('agent', {
      count: 2,
      baseTitle: 'Agent recommendation',
    });

    expect(Array.isArray(decisions)).toBe(true);
    expect(decisions).toHaveLength(2);
    expect(decisions[0]).toMatchObject({
      title: expect.stringContaining('Agent recommendation'),
      status: 'pending',
      confidence: expect.any(Number),
    });
  });

  it('executes a decision action through the provided callback', async () => {
    const callback = jest.fn().mockResolvedValue({ ok: true });
    const result = await aiDecisionService.executeDecisionAction({
      decision: { id: 'd-1', title: 'Review demand spike' },
      action: 'approve',
      callback,
    });

    expect(callback).toHaveBeenCalledWith('d-1', 'approve');
    expect(result).toMatchObject({
      ok: true,
      action: 'approve',
      decisionId: 'd-1',
    });
  });
});
