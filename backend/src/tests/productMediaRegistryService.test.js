const mediaRegistry = require('../services/catalog/productMediaRegistryService');

describe('NE product media registry governance', () => {
  it('loads the integrity-verified media registry', () => {
    const status = mediaRegistry.status();
    expect(status.mappingCount).toBe(14);
    expect(status.canonicalProductsWithRecoveredCandidates).toBe(9);
    expect(status.productionClearedMappings).toBe(0);
    expect(status.dataFileSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('keeps recovered candidate media blocked from production', () => {
    const rows = mediaRegistry.getCandidates('NEP-83E219230051A9BB');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.license.productionCleared === false)).toBe(true);
    expect(rows.every((row) => row.productionStatus === 'BLOCKED_PENDING_LICENSE_AND_VISUAL_CONFIRMATION')).toBe(true);
    expect(mediaRegistry.hasProductionMedia('NEP-83E219230051A9BB')).toBe(false);
  });

  it('returns no local file paths in safe candidate metadata', () => {
    const rows = mediaRegistry.getCandidates('NEP-A43C36F6573801B5');
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(JSON.stringify(rows)).not.toContain('New folder');
    expect(JSON.stringify(rows)).not.toContain('C:\\Users');
    expect(rows.some((row) => row.variantRole === 'alternate')).toBe(true);
  });

  it('preserves prototype-to-canonical confidence instead of flattening it', () => {
    const exact = mediaRegistry.getCandidates('NEP-A8C9B1D3E822B05E');
    expect(exact).toEqual(expect.arrayContaining([expect.objectContaining({ mappingConfidence: 'high', prototypeKey: 'queenpineapple' })]));
    const medium = mediaRegistry.getCandidates('NEP-750EADFA27358843');
    expect(medium).toEqual(expect.arrayContaining([expect.objectContaining({ mappingConfidence: 'medium', prototypeKey: 'hilltomato' })]));
  });

  it('reports the full 1171-product production media gap without pretending recovered candidates are usable', () => {
    const coverage = mediaRegistry.coverage();
    expect(coverage.totalProducts).toBe(1171);
    expect(coverage.productsWithRecoveredCandidates).toBe(9);
    expect(coverage.productionClearedProducts).toBe(0);
    expect(coverage.productsNeedingLicensedOrGeneratedMedia).toBe(1171);
  });
});
