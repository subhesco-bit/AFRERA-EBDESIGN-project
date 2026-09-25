const express = require('express');
const request = require('supertest');
const productMaster = require('../services/catalog/neProductMasterService');
const enrichment = require('../services/catalog/neVarietyEnrichmentService');
const { EVIDENCE_PERMISSION } = require('../services/catalog/neVarietyEnrichmentService');
const router = require('../routes/neProductMasterRoutes');

describe('NE variety enrichment governance', () => {
  it('loads all 1171 integrity-verified records with explicit/candidate taxonomy separated', () => {
    const stats = enrichment.stats();
    expect(stats.productCount).toBe(1171);
    expect(stats.scientificNameExplicit).toBe(48);
    expect(stats.scientificNameCandidates).toBe(462);
    expect(stats.dataFileSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(stats.truthRules.some((rule) => rule.includes('unresolved candidates'))).toBe(true);
  });

  it('does not turn a common-looking two-word prefix into a verified scientific name', () => {
    const matches = productMaster.findByExactName('Karongkandai (Oroxylum pods)');
    expect(matches).toHaveLength(1);
    const record = enrichment.getByProductId(matches[0].productId);
    expect(record.taxonomy.scientificName).toBeNull();
    expect(record.taxonomy.scientificNameCandidate).toBeNull();
    expect(record.taxonomy.candidateStatus).toBeNull();
    expect(record.fieldTruth.taxonomy).toBe('UNKNOWN');
  });

  it('preserves explicit parenthetical binomials as local evidence facts', () => {
    const rows = enrichment.records || [];
    enrichment.ensureLoaded();
    const explicit = enrichment.records.find((r) => r.taxonomy.scientificName);
    expect(explicit).toBeDefined();
    expect(explicit.taxonomy.scientificNameStatus).toBe('EXPLICIT_BINOMIAL_IN_PARENTHESES');
    expect(explicit.taxonomy.scientificNameID).toBeNull();
  });

  it('keeps Lakadong quantitative biochemical values as local claims, not verified facts', () => {
    const matches = productMaster.findByExactName('Lakadong Turmeric');
    expect(matches).toHaveLength(1);
    const safe = enrichment.getByProductId(matches[0].productId);
    expect(safe.quantitativeBiochemicalClaims).toEqual(expect.arrayContaining([
      expect.objectContaining({ metric: 'curcumin', reportedValueText: '≥7%', verificationStatus: 'LOCAL_CLAIM_NOT_EXTERNALLY_VERIFIED' }),
      expect.objectContaining({ metric: 'curcumin', reportedValueText: '7.4%', verificationStatus: 'LOCAL_CLAIM_NOT_EXTERNALLY_VERIFIED' }),
    ]));
    expect(JSON.stringify(safe)).not.toContain('line:789');
    const full = enrichment.getByProductId(matches[0].productId, { permissions: [EVIDENCE_PERMISSION] });
    expect(full.quantitativeBiochemicalClaims[0].source).toBeDefined();
  });

  it('returns public-safe enrichment over HTTP and never exposes internal evidence paths', async () => {
    const app = express();
    app.use('/api/v1/catalog/ne-products', router);
    const matches = productMaster.findByExactName('Lakadong Turmeric');
    const res = await request(app).get('/api/v1/catalog/ne-products/products/' + matches[0].productId + '/enrichment');
    expect(res.status).toBe(200);
    expect(res.body.enrichment.productId).toBe(matches[0].productId);
    expect(res.body.truthStatus.internalEvidence).toBe('NOT_EXPOSED');
    expect(JSON.stringify(res.body)).not.toContain('LOCAL.NE:');
    expect(JSON.stringify(res.body)).not.toContain('line:');
  });

  it('can attach enrichment to catalog search without leaking farmer MAP or raw evidence', async () => {
    const app = express();
    app.use('/api/v1/catalog/ne-products', router);
    const res = await request(app).get('/api/v1/catalog/ne-products/products?q=Lakadong%20Turmeric&limit=1&includeEnrichment=true');
    expect(res.status).toBe(200);
    const product = res.body.data.results[0];
    expect(product.enrichment).toBeDefined();
    expect(product.pricing.farmerMapFloorPrototype.redacted).toBe(true);
    expect(product.enrichment.quantitativeBiochemicalClaims.length).toBeGreaterThan(0);
    expect(JSON.stringify(product)).not.toContain('LOCAL.NE:');
  });
});
