// Controller for Orchard Management (M141)
const service = require('./service');
const { logger } = require('../../utils/logger');

async function listOrchards(req, res) {
  try {
    const { page, limit, farmerId } = req.query;
    const result = await service.listOrchards({ page, limit, farmerId });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listOrchards error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getOrchard(req, res) {
  try {
    const orchard = await service.getOrchard(req.params.orchardId);
    if (!orchard) return res.status(404).json({ success: false, error: 'Orchard not found' });
    res.json({ success: true, data: orchard });
  } catch (error) {
    logger.error('getOrchard error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function createOrchard(req, res) {
  try {
    let orchard = await service.createOrchard(req.body);
    res.status(201).json({ success: true, data: orchard });
  } catch (error) {
    logger.error('createOrchard error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateOrchard(req, res) {
  try {
    let orchard = await service.updateOrchard(req.params.orchardId, req.body);
    if (!orchard) return res.status(404).json({ success: false, error: 'Orchard not found' });
    res.json({ success: true, data: orchard });
  } catch (error) {
    logger.error('updateOrchard error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteOrchard(req, res) {
  try {
    const deleted = await service.deleteOrchard(req.params.orchardId);
    if (!deleted) return res.status(404).json({ success: false, error: 'Orchard not found' });
    res.json({ success: true });
  } catch (error) {
    logger.error('deleteOrchard error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getOrchardProduction(req, res) {
  try {
    const production = await service.getOrchardProduction(req.params.orchardId, req.query.year);
    res.json({ success: true, data: production });
  } catch (error) {
    logger.error('getOrchardProduction error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function recordOrchardProduction(req, res) {
  try {
    // orchardId comes from the route param, but the service destructures it
    // from the payload body - merge so the URL's :orchardId isn't silently
    // ignored in favor of (or overwritten by) whatever the body contains.
    const record = await service.recordOrchardProduction({ ...req.body, orchardId: req.params.orchardId });
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    logger.error('recordOrchardProduction error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getOrchardAnalytics(req, res) {
  try {
    const analytics = await service.getOrchardAnalytics(req.params.orchardId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getOrchardAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  listOrchards,
  getOrchard,
  createOrchard,
  updateOrchard,
  deleteOrchard,
  getOrchardProduction,
  recordOrchardProduction,
  getOrchardAnalytics,
};
