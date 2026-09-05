const service = require('../services/dietTherapyService');

jest.mock('../services/legacy/aiBackboneService', () => ({ callAI: jest.fn() }));

describe('diet therapy service', () => {
  it('builds a regional education baseline without clinical claims', async () => {
    const result = await service.createPlan({ age: 35, sex: 'female', region: 'assam', allergies: ['fish'] }, { useAI: false });
    expect(result.baseline.regional_food_groups).toContain('rice');
    expect(result.baseline.clinical_status).toBe('education_only');
    expect(result.disclaimer).toContain('not medical advice');
  });

  it('rejects unsafe or incomplete profiles', async () => {
    await expect(service.createPlan({ age: 0, sex: 'female' }, { useAI: false })).rejects.toThrow('age');
    await expect(service.createPlan({ age: 35 }, { useAI: false })).rejects.toThrow('sex');
  });
});