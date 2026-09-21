'use strict';

const express = require('express');
const request = require('supertest');
jest.mock('../services/legacy/ecommerceService', () => ({
  getMarketplaceListings: jest.fn(), getGIListings: jest.fn(), getMarketPriceTrends: jest.fn(),
  getSellerAnalytics: jest.fn(), getSellerOrigins: jest.fn(), getSellerListings: jest.fn(),
  createProductListing: jest.fn(), updateSellerListing: jest.fn(), deleteSellerListing: jest.fn(),
}));
const service = require('../services/legacy/ecommerceService');
const auth = require('../services/dual-use/authService');
const routes = require('../routes/ecommerceMarketplaceDomainRoutes');

describe('canonical marketplace page HTTP contract', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', routes);
  const token = auth.generateAccessToken({ id: '11111111-1111-4111-8111-111111111111', role: 'farmer' });

  beforeEach(() => Object.values(service).forEach((fn) => fn.mockReset()));

  test('national discovery is public; publishing requires an authenticated seller', async () => {
    service.getMarketplaceListings.mockResolvedValue({ success: true, products: [{ id: 'north-east-produce' }] });
    const browse = await request(app).get('/api/v1/ecommerce-marketplace/listings').expect(200);
    expect(browse.body.products[0].id).toBe('north-east-produce');
    await request(app).post('/api/v1/ecommerce-marketplace/listing').send({ product_name: 'produce' }).expect(401);
    expect(service.createProductListing).not.toHaveBeenCalled();
  });

  test('seller origins and listings use token identity, not a caller-supplied seller id', async () => {
    service.getSellerOrigins.mockResolvedValue({ success: true, origins: [] });
    await request(app).get('/api/v1/ecommerce-marketplace/seller-origins').set('Authorization', `Bearer ${token}`).expect(200);
    expect(service.getSellerOrigins).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
  });
});
