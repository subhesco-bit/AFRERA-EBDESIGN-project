// Controller for System Administration (M006)
const service = require('./service');
const { logger } = require('../../utils/logger');

async function listSettings(req, res) {
  try {
    const rows = await service.listSettings();
    res.json({ success: true, data: rows });
  } catch (error) {
    logger.error('listSettings error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getSetting(req, res) {
  try {
    const name = req.params.name;
    const row = await service.getSetting(name);
    if (!row) return res.status(404).json({ success: false, error: 'Setting not found' });
    res.json({ success: true, data: row });
  } catch (error) {
    logger.error('getSetting error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function upsertSetting(req, res) {
  try {
    const name = req.params.name;
    const value = req.body.value;
    const description = req.body.description;
    const row = await service.upsertSetting(name, value, description);
    res.json({ success: true, data: row });
  } catch (error) {
    logger.error('upsertSetting error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function ingestAudit(req, res) {
  try {
    const entry = req.body;
    const result = await service.ingestAuditLog(entry);
    res.json(result);
  } catch (error) {
    logger.error('ingestAudit error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { listSettings, getSetting, upsertSetting, ingestAudit };

