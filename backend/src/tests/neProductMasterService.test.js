const productMaster = require('../services/catalog/neProductMasterService');
const { MAP_PERMISSION } = require('../services/catalog/neProductMasterService');

describe('NE canonical product master', () => {
  it('loads exactly 1171 integrity-verified products with reconciled GI statistics', () => {
    const stats = productMaster.stats();
    expect(stats.productCount).toBe(1171);
    expect(stats.categoryCount).toBe(12);
    expect(stats.giPrototypeClaimCount).toBe(30);
    expect(stats.giRegisteredDirectCount).toBe(19);
    expect(stats.giPrototypeFalseNegativeDirectCount).toBe(1);
    expect(stats.qualityFlaggedCount).toBe(0);
    expect(stats.catalogSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hides farmer MAP and raw provenance from buyer/public views', () => {
    const result = productMaster.search('Assam Orthodox Tea', { limit: 1 });
    expect(result.results).toHaveLength(1);
    const product = result.results[0];
    expect(product.pricing.farmerMapFloorPrototype).toEqual({ visibility: 'farmer_private', redacted: true });
    expect(product.provenance).toBeUndefined();
    expect(JSON.stringify(product)).not.toContain('350');
  });

  it('reveals MAP only with the explicit catalog permission', () => {
    const result = productMaster.search('Assam Orthodox Tea', { limit: 1 }, { permissions: [MAP_PERMISSION] });
    expect(result.results[0].pricing.farmerMapFloorPrototype.amount).toBe(350);
    expect(result.results[0].provenance.rawRow).toBeDefined();
  });

  it('links the older Bhut Jolokia prototype record without inventing GI registration', () => {
    const result = productMaster.findByExactName('Bhut Jolokia');
    expect(result).toHaveLength(1);
    expect(result[0].identity.name).toBe('Bhut Jolokia (Assam-grown)');
    expect(result[0].gi.prototypeClaim).toBe(false);
    expect(result[0].gi.registeredAsListedGood).toBe(false);
    expect(result[0].gi.verificationStatus).toBe('NO_MATCH_IN_REGISTER_SNAPSHOT');
  });

  it('exposes verified GI legal status separately from prototype claims', () => {
    const product = productMaster.search('Khasi Mandarin', { limit: 1 }, { permissions: [MAP_PERMISSION] }).results[0];
    expect(product.pricing.retailPricePrototype.verificationStatus).toBe('PROTOTYPE_VALUE_PENDING_PHASE_048');
    expect(product.gi.prototypeClaim).toBe(true);
    expect(product.gi.verificationStatus).toBe('VERIFIED_REGISTERED_DIRECT');
    expect(product.gi.registryId).toBe('465');
    expect(product.gi.officialEvidence.registeredName).toBe('Khasi Mandarin');
  });

  it('detects Lakadong Turmeric even though the prototype GI flag was false', () => {
    const product = productMaster.search('Lakadong Turmeric', { limit: 1 }).results[0];
    expect(product.gi.prototypeClaim).toBe(false);
    expect(product.gi.registeredAsListedGood).toBe(true);
    expect(product.gi.verificationStatus).toBe('VERIFIED_REGISTERED_DIRECT');
    expect(product.gi.registryId).toBe('741');
  });

  it('filters deterministically by category, origin and prototype GI claim', () => {
    const result = productMaster.search('', { category: 'Spices', origin: 'Nagaland', giClaim: true, limit: 200 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.results.every((p) => p.identity.category === 'Spices' && p.identity.originLabel === 'Nagaland' && p.gi.prototypeClaim === true)).toBe(true);
  });

  it('filters independently by verified registered-as-listed-good status', () => {
    const result = productMaster.search('', { giRegistered: true, limit: 200 });
    expect(result.total).toBe(19);
    expect(result.results.every((p) => p.gi.registeredAsListedGood === true)).toBe(true);
  });
});
