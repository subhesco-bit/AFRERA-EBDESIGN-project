/**
 * Layer-separated routes:
 *   /api/v1/farmer/*
 *   /api/v1/ecommerce/*
 *   /api/v1/bridge/farm-commerce/*
 */

'use strict';

const express = require('express');
const farmerLayer = require('../services/layers/farmerLayerService');
const ecommerceLayer = require('../services/layers/ecommerceLayerService');
const bridge = require('../services/layers/farmCommerceBridge');
const { LAYERS } = require('../services/layers/layerBoundary');

function mount(app) {
  const farmerRouter = express.Router();
  const ecommerceRouter = express.Router();
  const bridgeRouter = express.Router();

  function handle(serviceOperate) {
    return async (req, res) => {
      try {
        const result = await serviceOperate({ ...req.body, ...req.query, action: req.body?.action || req.params.action });
        res.json({ success: true, ...result });
      } catch (e) {
        const status = e.code === 'LAYER_BOUNDARY_VIOLATION' || e.code === 'LAYER_CROSS_CONTAMINATION' ? 400 : 500;
        res.status(status).json({ success: false, error: e.message, code: e.code });
      }
    };
  }

  farmerRouter.get('/health', (req, res) => {
    res.json({ success: true, layer: LAYERS.FARMER, status: 'healthy' });
  });
  farmerRouter.post('/operate', handle(farmerLayer.operate));
  farmerRouter.post('/:action', (req, res, next) => {
    req.body = { ...(req.body || {}), action: req.params.action };
    return handle(farmerLayer.operate)(req, res, next);
  });

  ecommerceRouter.get('/health', (req, res) => {
    res.json({ success: true, layer: LAYERS.ECOMMERCE, status: 'healthy' });
  });
  ecommerceRouter.post('/operate', handle(ecommerceLayer.operate));
  ecommerceRouter.post('/:action', (req, res, next) => {
    req.body = { ...(req.body || {}), action: req.params.action };
    return handle(ecommerceLayer.operate)(req, res, next);
  });

  bridgeRouter.get('/health', (req, res) => {
    res.json({ success: true, layer: LAYERS.BRIDGE, status: 'healthy' });
  });
  bridgeRouter.post('/operate', handle(bridge.operate));
  bridgeRouter.post('/listing-from-lot', (req, res, next) => {
    req.body = { ...(req.body || {}), action: 'listing_from_lot' };
    return handle(bridge.operate)(req, res, next);
  });
  bridgeRouter.post('/input-purchase-link', (req, res, next) => {
    req.body = { ...(req.body || {}), action: 'input_purchase_link' };
    return handle(bridge.operate)(req, res, next);
  });

  app.use('/api/v1/farmer', farmerRouter);
  app.use('/api/v1/ecommerce', ecommerceRouter);
  app.use('/api/v1/bridge/farm-commerce', bridgeRouter);
}

module.exports = { mount };
module.exports.routerMount = mount;
