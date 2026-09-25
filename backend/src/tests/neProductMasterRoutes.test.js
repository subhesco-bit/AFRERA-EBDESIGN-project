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
    expect(res.body.truthStatus.farmerMap).toBe('PRIVATE_NOT_EXPOSED');
  });

  it('exposes explicit prototype truth status for GI and prices', async () => {
    const res = await request(app).get('/api/v1/catalog/ne-products/products?q=Naga%20Mircha&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.truthStatus).toEqual(expect.objectContaining({
      gi:'UNVERIFIED_PENDING_PHASE_047',
      pricing:'PROTOTYPE_VALUES_PENDING_PHASE_048',
    }));
  });

  it('returns 404 for unknown product ids', async () => {
    const res = await request(app).get('/api/v1/catalog/ne-products/products/NEP-DOES-NOT-EXIST');
    expect(res.status).toBe(404);
  });
});
