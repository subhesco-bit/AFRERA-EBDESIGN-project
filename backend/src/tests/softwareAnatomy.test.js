const { anatomy, validateAnatomy, createSkeleton } = require('../core/softwareAnatomy');

describe('Software anatomy model', () => {
  it('creates a skeleton containing every required layer and cross-cutting concern', () => {
    const model = createSkeleton('M900_TEST','DOMAIN:FOUNDATION');
    for (const layer of anatomy.requiredLayers) expect(model).toHaveProperty(layer);
    for (const concern of anatomy.crossCutting) expect(model).toHaveProperty(concern);
  });

  it('accepts a complete skeleton', () => {
    const result = validateAnatomy(createSkeleton('M900_TEST','DOMAIN:FOUNDATION'));
    expect(result.valid).toBe(true);
    expect(result.completeness).toBe(1);
  });

  it('fails when canonical storage/audit layers are absent', () => {
    const model = createSkeleton('M900_TEST','DOMAIN:FOUNDATION');
    delete model.storage;
    delete model.audit;
    const result = validateAnatomy(model);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(['missing layer storage','missing layer audit']));
  });

  it('requires rationale and reviewer for not-applicable layers', () => {
    const model = createSkeleton('M900_TEST','DOMAIN:FOUNDATION');
    model.learning = { notApplicable:true };
    const result = validateAnatomy(model);
    expect(result.errors).toEqual(expect.arrayContaining(['learning: notApplicable requires rationale','learning: notApplicable requires reviewer']));
  });
});
