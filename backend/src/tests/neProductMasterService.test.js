const productMaster = require('../services/catalog/neProductMasterService');
const { MAP_PERMISSION } = require('../services/catalog/neProductMasterService');

describe('NE canonical product master', () => {
  it('loads exactly 1171 integrity-verified products', () => {
    const stats = productMaster.stats();
    expect(stats.productCount).toBe(1171);
    expect(stats.categoryCount).toBe(12);
    expect(stats.giPrototypeClaimCount).toBe(30);
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

  it('links the older Bhut Jolokia prototype record into the corrected canonical product', () => {
    const result = productMaster.findByExactName('Bhut Jolokia');
    expect(result).toHaveLength(1);
    expect(result[0].identity.name).toBe('Bhut Jolokia (Assam-grown)');
    expect(result[0].gi.prototypeClaim).toBe(false);
    expect(result[0].gi.verificationStatus).toBe('UNVERIFIED_PENDING_PHASE_047');
  });

  it('does not present prototype prices or GI flags as authoritative truth', () => {
    const result = productMaster.search('Khasi Mandarin', { limit: 1 }, { permissions: [MAP_PERMISSION] });
    const product = result.results[0];
    expect(product.pricing.retailPricePrototype.verificationStatus).toBe('PROTOTYPE_VALUE_PENDING_PHASE_048');
    expect(product.gi.verificationStatus).toBe('UNVERIFIED_PENDING_PHASE_047');
  });

  it('filters deterministically by category, origin and GI prototype claim', () => {
    const result = productMaster.search('', { category: 'Spices', origin: 'Nagaland', giClaim: true, limit: 200 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.results.every((p) => p.identity.category === 'Spices' && p.identity.originLabel === 'Nagaland' && p.gi.prototypeClaim === true)).toBe(true);
  });
});
