// Controller for Pond Management (M132)
// service.js's module.exports lists exactly 9 public functions (the rest -
// registerSensor, fetchSensorData, processSensorData, predictGrowthPotential,
// optimizeFeeding, assessDiseaseRisk, predictHarvest, enrichWithSensorData -
// are internal helpers called by these). This file was a 3-line stub despite
// service.js being a real 519-line implementation; wiring it to what's exported.
const service = require('./service');
const { logger } = require('../../utils/logger');

async function listPonds(req, res) {
  try {
    const { page, limit, farmerId, status } = req.query;
    const result = await service.listPonds({ page, limit, farmerId, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listPonds error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getPond(req, res) {
  try {
    const pond = await service.getPond(req.params.pondId);
    if (!pond) return res.status(404).json({ success: false, error: 'Pond not found' });
    res.json({ success: true, data: pond });
  } catch (error) {
    logger.error('getPond error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function createPond(req, res) {
  try {
    const pond = await service.createPond(req.body);
    res.status(201).json({ success: true, data: pond });
  } catch (error) {
    logger.error('createPond error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updatePond(req, res) {
  try {
    const pond = await service.updatePond(req.params.pondId, req.body);
    if (!pond) return res.status(404).json({ success: false, error: 'Pond not found' });
    res.json({ success: true, data: pond });
  } catch (error) {
    logger.error('updatePond error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deletePond(req, res) {
  try {
    const deleted = await service.deletePond(req.params.pondId);
    if (!deleted) return res.status(404).json({ success: false, error: 'Pond not found' });
    res.json({ success: true });
  } catch (error) {
    logger.error('deletePond error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function configurePondSensors(req, res) {
  try {
    const result = await service.configurePondSensors(req.params.pondId, req.body.sensors || []);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('configurePondSensors error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getPondSensorData(req, res) {
  try {
    const { startTime, endTime, sensorTypes } = req.query;
    const data = await service.getPondSensorData(req.params.pondId, { startTime, endTime, sensorTypes });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('getPondSensorData error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getPondHealthIndex(req, res) {
  try {
    const health = await service.getPondHealthIndex(req.params.pondId);
    res.json({ success: true, data: health });
  } catch (error) {
    logger.error('getPondHealthIndex error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getPondAIInsights(req, res) {
  try {
    const insights = await service.getPondAIInsights(req.params.pondId);
    res.json({ success: true, data: insights });
  } catch (error) {
    logger.error('getPondAIInsights error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  listPonds,
  getPond,
  createPond,
  updatePond,
  deletePond,
  configurePondSensors,
  getPondSensorData,
  getPondHealthIndex,
  getPondAIInsights,
};
