const express = require('express');
const request = require('supertest');
const router = require('../routes/neProductMasterRoutes');

describe('NE product master HTTP contract', () => {
  const app = express();
  app.use('/api/v1/catalog/ne-products', router);

  it('returns public-safe products without farmer MAP or raw provenance', async () => {
    const res = await request(app).get('/api/v1/catalog/ne-products/products?q=Assam%20Orthodox%20Tea&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results).toHaveLength(1);
    expect(res.body.data.results[0].pricing.farmerMapFloorPrototype).toEqual({ visibility:'farmer_private', redacted:true });
    expect(res.body.data.results[0].provenance).toBeUndefined();
    expect(res.body.data.results[0].gi.verificationStatus).toBe('VERIFIED_REGISTERED_DIRECT');
    expect(res.body.truthStatus.farmerMap).toBe('PRIVATE_NOT_EXPOSED');
  });

  it('exposes reconciled official GI truth and the register effective date', async () => {
    const res = await request(app).get('/api/v1/catalog/ne-products/products?q=Naga%20Mircha&limit=20');
    expect(res.status).toBe(200);
    expect(res.body.truthStatus).toEqual(expect.objectContaining({
      gi:'PHASE_047_OFFICIAL_REGISTER_RECONCILED',
      giRegisterEffectiveThrough:'2025-12-31',
      pricing:'PROTOTYPE_VALUES_PENDING_PHASE_048',
    }));
    const naga = res.body.data.results.find((p) => p.identity.name === 'Naga Mircha');
    expect(naga).toBeDefined();
    expect(naga.gi.registryId).toBe('109');
  });

  it('supports verified GI filtering independently from prototype flags', async () => {
    const res = await request(app).get('/api/v1/catalog/ne-products/products?giRegistered=true&limit=200');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(19);
    expect(res.body.data.results.every((p) => p.gi.registeredAsListedGood)).toBe(true);
  });

  it('publishes GI reconciliation issues and the false-negative correction', async () => {
    const issues = await request(app).get('/api/v1/catalog/ne-products/gi/issues');
    const falseNegatives = await request(app).get('/api/v1/catalog/ne-products/gi/false-negatives');
    expect(issues.status).toBe(200);
    expect(issues.body.count).toBe(12);
    expect(falseNegatives.body.count).toBe(1);
    expect(falseNegatives.body.data[0].productName).toBe('Lakadong Turmeric');
  });

  it('returns a product-specific official GI provenance record', async () => {
    const search = await request(app).get('/api/v1/catalog/ne-products/products?q=Kachai%20Lemon&limit=1');
    const id = search.body.data.results[0].productId;
    const res = await request(app).get(`/api/v1/catalog/ne-products/products/${id}/gi`);
    expect(res.status).toBe(200);
    expect(res.body.gi.officialEvidence.applicationNumberRaw).toBe('466');
    expect(res.body.gi.registeredAsListedGood).toBe(true);
  });

  it('returns 404 for unknown product ids', async () => {
    const res = await request(app).get('/api/v1/catalog/ne-products/products/NEP-DOES-NOT-EXIST');
    expect(res.status).toBe(404);
  });
});
