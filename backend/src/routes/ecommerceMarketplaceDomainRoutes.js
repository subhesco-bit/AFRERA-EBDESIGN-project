/**
 * Real backend routes for EcommerceMarketplacePage.jsx, backed by
 * services/legacy/ecommerceService.js.
 *
 * getListings -> getMarketplaceListings, getPriceTrends -> getMarketPriceTrends,
 * createListing -> createProductListing (takes sellerId + data; sellerId
 * filled from the authenticated user). updateListing, deleteListing, and
 * getSellerListings have no matching implementation - not wired, flagged
 * instead of faked.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/ecommerceService');
const { authMiddleware, userRateLimit } = require('../middleware/auth');

const wrap = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: error.statusCode ? error.message : 'Marketplace operation failed' });
  }
};

router.get('/ecommerce-marketplace/gi-listings', wrap((req) => svc.getGIListings(req.query)));
router.get('/ecommerce-marketplace/listings', wrap((req) => svc.getMarketplaceListings(req.query, req.query)));
router.get('/ecommerce-marketplace/price-trends/:categoryId', wrap((req) => svc.getMarketPriceTrends(req.params.categoryId, req.query.period)));
router.get('/ecommerce-marketplace/seller-analytics', authMiddleware, wrap((req) => svc.getSellerAnalytics(req.user.id, req.query.period)));
router.get('/ecommerce-marketplace/seller-origins', authMiddleware, wrap((req) => svc.getSellerOrigins(req.user.id)));
router.get('/ecommerce-marketplace/seller-listings', authMiddleware, wrap((req) => svc.getSellerListings(req.user.id)));
router.post('/ecommerce-marketplace/listing', authMiddleware, userRateLimit(10, 60_000), wrap((req) => svc.createProductListing(req.user.id, req.body)));
router.put('/ecommerce-marketplace/listing/:id', authMiddleware, wrap((req) => svc.updateSellerListing(req.params.id, req.user.id, req.body)));
router.delete('/ecommerce-marketplace/listing/:id', authMiddleware, wrap((req) => svc.deleteSellerListing(req.params.id, req.user.id)));

module.exports = router;
