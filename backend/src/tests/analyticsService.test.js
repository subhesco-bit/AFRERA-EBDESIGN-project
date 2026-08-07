const { buildPipelineInsights } = require('../services/analyticsService');

describe('analyticsService', () => {
  it('builds analytics summary from form store data', () => {
    const payload = {
      forms: [
        { id: '1', status: 'active', workflow: { stages: [{}, {}] } },
        { id: '2', status: 'draft', workflow: {} },
        { id: '3', status: 'review', workflow: { stages: [{}] } }
      ],
      submissions: [{ id: 'a' }, { id: 'b' }]
    };

    const result = buildPipelineInsights(payload);

    expect(result.totals.forms).toBe(3);
    expect(result.totals.submissions).toBe(2);
    expect(result.totals.activeForms).toBe(2);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
