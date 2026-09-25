const gi = require('../services/catalog/neGiProvenanceService');
const productMaster = require('../services/catalog/neProductMasterService');

describe('NE GI certification provenance', () => {
  it('loads a 1171-product integrity-verified reconciliation', () => {
    const stats = gi.stats();
    expect(stats.productCount).toBe(1171);
    expect(stats.prototypeClaimCount).toBe(30);
    expect(stats.registeredDirectCount).toBe(19);
    expect(stats.prototypeFalseNegativeDirectCount).toBe(1);
    expect(stats.registerEffectiveThrough).toBe('2025-12-31');
    expect(stats.sourcePdfSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('verifies Assam Orthodox Tea against the official application numbers', () => {
    const p = productMaster.findByExactName('Assam Orthodox Tea')[0];
    const r = gi.getByProductId(p.productId);
    expect(r.verificationStatus).toBe('VERIFIED_REGISTERED_DIRECT');
    expect(r.registeredAsListedGood).toBe(true);
    expect(r.officialEvidence.registeredName).toBe('Assam (Orthodox)');
    expect(r.officialEvidence.applicationNumberRaw).toBe('115 & 118');
  });

  it('does not let a processed derivative inherit direct GI registration', () => {
    const p = productMaster.findByExactName('Kaji Nemu Pickle')[0];
    const r = gi.getByProductId(p.productId);
    expect(r.verificationOutcome).toBe('DERIVATIVE_OF_REGISTERED_GI_NOT_DIRECT_REGISTRATION');
    expect(r.registeredAsListedGood).toBe(false);
    expect(r.officialEvidence.registeredName).toBe('Kaji Nemu');
  });

  it('surfaces the Memang/Memong name-state conflict rather than silently correcting it', () => {
    const p = productMaster.findByExactName('Memang Narang')[0];
    const r = gi.getByProductId(p.productId);
    expect(r.verificationOutcome).toBe('POSSIBLE_NAME_MATCH_WITH_STATE_CONFLICT');
    expect(r.productOrigin).toBe('Arunachal Pradesh');
    expect(r.officialEvidence.registeredName).toBe('Memong Narang');
    expect(r.officialEvidence.state).toBe('Meghalaya');
    expect(r.registeredAsListedGood).toBe(false);
  });

  it('keeps Sweet Cucumber unresolved instead of assuming it is Naga Cucumber', () => {
    const p = productMaster.findByExactName('Sweet Cucumber')[0];
    const r = gi.getByProductId(p.productId);
    expect(r.verificationOutcome).toBe('POSSIBLE_ALIAS_REQUIRES_IDENTITY_EVIDENCE');
    expect(r.officialEvidence.registeredName).toBe('Naga Cucumber');
    expect(r.registeredAsListedGood).toBe(false);
  });

  it('does not confuse Assam CTC Tea with the Assam Orthodox GI', () => {
    const p = productMaster.findByExactName('Assam CTC Tea')[0];
    const r = gi.getByProductId(p.productId);
    expect(r.verificationOutcome).toBe('PROTOTYPE_CLAIM_NOT_FOUND_IN_REGISTER');
    expect(r.officialEvidence).toBeNull();
    expect(r.registeredAsListedGood).toBe(false);
  });

  it('detects Lakadong Turmeric as a prototype false negative', () => {
    const rows = gi.falseNegatives();
    expect(rows).toHaveLength(1);
    expect(rows[0].productName).toBe('Lakadong Turmeric');
    expect(rows[0].officialEvidence.registeredName).toBe('Lakadong Turmeric');
    expect(rows[0].officialEvidence.applicationNumberRaw).toBe('741');
  });

  it('preserves all 12 prototype-claim exceptions for remediation', () => {
    const issues = gi.issues();
    expect(issues).toHaveLength(12);
    expect(issues.filter((x) => x.verificationOutcome === 'DERIVATIVE_OF_REGISTERED_GI_NOT_DIRECT_REGISTRATION')).toHaveLength(8);
  });
});
