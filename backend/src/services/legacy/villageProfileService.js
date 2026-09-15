/**
 * Canonical Village Profile compatibility service.
 *
 * M041 is now the single source of truth for village registry operations.
 * This compatibility layer preserves the existing legacy route surface while
 * delegating reads/writes to the same persistent `villages` implementation.
 */

'use strict';

const villageService = require('../../modules/M041/service');
const { logger } = require('../../utils/logger');
const express = require('express');

function setupRoutes(app) {
  const router = express.Router();
  const authMiddleware = require('../../middleware/auth');
  router.use(authMiddleware);

  router.get('/villages/:villageId', async (req, res) => {
    try { res.json({ success: true, data: await villageService.getVillageProfile(req.params.villageId) }); }
    catch (error) { logger.error(`Village profile lookup failed: ${error.message}`); res.status(error.statusCode || 404).json({ success: false, error: error.message }); }
  });

  router.get('/villages/district/:district', async (req, res) => {
    try { res.json({ success: true, data: (await villageService.getVillages({ district: req.params.district, status: 'all', limit: 100 })).data }); }
    catch (error) { logger.error(`Village district lookup failed: ${error.message}`); res.status(error.statusCode || 500).json({ success: false, error: error.message }); }
  });

  router.get('/villages/block/:block', async (req, res) => {
    try { res.json({ success: true, data: (await villageService.getVillages({ block: req.params.block, status: 'all', limit: 100 })).data }); }
    catch (error) { logger.error(`Village block lookup failed: ${error.message}`); res.status(error.statusCode || 500).json({ success: false, error: error.message }); }
  });

  router.get('/districts/:district/economic-summary', async (req, res) => {
    try { res.json({ success: true, data: await villageService.getDistrictEconomicSummary(req.params.district) }); }
    catch (error) { logger.error(`District village summary failed: ${error.message}`); res.status(error.statusCode || 404).json({ success: false, error: error.message }); }
  });

  router.post('/villages', async (req, res) => {
    try { res.status(201).json({ success: true, data: await villageService.createVillage(req.body) }); }
    catch (error) { logger.error(`Village create failed: ${error.message}`); res.status(error.statusCode || 400).json({ success: false, error: error.message }); }
  });

  router.put('/villages/:villageId', async (req, res) => {
    try { res.json({ success: true, data: await villageService.updateVillage(req.params.villageId, req.body) }); }
    catch (error) { logger.error(`Village update failed: ${error.message}`); res.status(error.statusCode || 400).json({ success: false, error: error.message }); }
  });

  router.get('/villages/search', async (req, res) => {
    try { res.json({ success: true, data: await villageService.searchVillages(req.query) }); }
    catch (error) { logger.error(`Village search failed: ${error.message}`); res.status(error.statusCode || 500).json({ success: false, error: error.message }); }
  });

  app.use('/api/v1/village-profiles', router);
  logger.info('Canonical village profile compatibility routes mounted at /api/v1/village-profiles');
}

module.exports = { ...villageService, setupRoutes };
