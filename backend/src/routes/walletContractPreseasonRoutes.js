/**
 * Wallet · Contract farming · Preseason purchase
 * Mount helpers — see module.exports.mount
 */

'use strict';

const express = require('express');
const wallet = require('../services/commerce/walletService');
const contractFarming = require('../services/farmer/contractFarmingService');
const preseason = require('../services/commerce/preseasonPurchaseService');

function fail(res, e) {
  const code = e.code || '';
  const status = /NOT_FOUND|INVALID|INSUFFICIENT|AMOUNT|BUYER|HOLD|PSO_|CF_|WALLET_/.test(code)
    ? 400
    : 500;
  res.status(status).json({ success: false, error: e.message, code: e.code });
}

function mount(app) {
  const w = express.Router();
  w.get('/health', (req, res) => res.json({ success: true, service: 'wallet' }));
  w.post('/operate', async (req, res) => {
    try {
      res.json({ success: true, ...(await wallet.operate(req.body || {})) });
    } catch (e) {
      fail(res, e);
    }
  });
  w.post('/credit', async (req, res) => {
    try {
      res.json({ success: true, ...wallet.credit(req.body.owner_id, req.body.amount, req.body) });
    } catch (e) {
      fail(res, e);
    }
  });
  w.get('/:ownerId', (req, res) => {
    res.json({ success: true, wallet: wallet.snapshot(req.params.ownerId) });
  });
  app.use('/api/v1/wallet', w);

  const cf = express.Router();
  cf.get('/health', (req, res) => res.json({ success: true, layer: 'farmer', service: 'contract_farming' }));
  cf.post('/operate', async (req, res) => {
    try {
      res.json({ success: true, layer: 'farmer', ...(await contractFarming.operate(req.body || {})) });
    } catch (e) {
      fail(res, e);
    }
  });
  cf.post('/', async (req, res) => {
    try {
      res.json({
        success: true,
        layer: 'farmer',
        contract: contractFarming.create(req.body || {}),
      });
    } catch (e) {
      fail(res, e);
    }
  });
  cf.post('/:id/transition', async (req, res) => {
    try {
      res.json({
        success: true,
        contract: contractFarming.transition(req.params.id, req.body?.to, req.body?.event),
      });
    } catch (e) {
      fail(res, e);
    }
  });
  app.use('/api/v1/contract-farming', cf);

  const ps = express.Router();
  ps.get('/health', (req, res) =>
    res.json({ success: true, layer: 'ecommerce', service: 'preseason_purchase' }),
  );
  ps.post('/analyze', async (req, res) => {
    try {
      res.json({
        success: true,
        ...preseason.analyzePreseason(req.body?.commodity || 'tomato', req.body?.season),
      });
    } catch (e) {
      fail(res, e);
    }
  });
  ps.post('/price', async (req, res) => {
    try {
      res.json({ success: true, ...preseason.pricePreseasonLine(req.body?.sku, req.body || {}) });
    } catch (e) {
      fail(res, e);
    }
  });
  ps.post('/orders', async (req, res) => {
    try {
      res.json({ success: true, ...(await preseason.operate({ ...req.body, action: 'create' })) });
    } catch (e) {
      fail(res, e);
    }
  });
  ps.post('/orders/:id/hold', async (req, res) => {
    try {
      res.json({ success: true, ...preseason.holdDeposit(req.params.id) });
    } catch (e) {
      fail(res, e);
    }
  });
  ps.post('/orders/:id/confirm', async (req, res) => {
    try {
      res.json({
        success: true,
        ...preseason.confirm(req.params.id, req.body || {}),
      });
    } catch (e) {
      fail(res, e);
    }
  });
  ps.post('/operate', async (req, res) => {
    try {
      res.json({ success: true, ...(await preseason.operate(req.body || {})) });
    } catch (e) {
      fail(res, e);
    }
  });
  app.use('/api/v1/preseason', ps);
}

module.exports = { mount };
