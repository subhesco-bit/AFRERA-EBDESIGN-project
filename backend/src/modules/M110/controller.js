// Controller for Asset Lifecycle Management (M110)
const service = require('./service');

async function registerAsset(req, res) {
  try {
    const asset = await service.registerAsset(req.body);
    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

async function updateLifecycleStage(req, res) {
  try {
    const stage = await service.updateLifecycleStage(req.params.id, req.body);
    res.json({ success: true, data: stage });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

async function trackAssetDepreciation(req, res) {
  try {
    const depreciation = await service.trackAssetDepreciation(req.params.id, req.query.period);
    res.json({ success: true, data: depreciation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function generateLifecycleReport(req, res) {
  try {
    const report = await service.generateLifecycleReport(req.params.farmerId, req.query.reportType);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { registerAsset, updateLifecycleStage, trackAssetDepreciation, generateLifecycleReport };
