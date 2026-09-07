/**
 * Controller for Water Quality Monitoring (M077)
 * Handles HTTP requests for water quality operations
 */

const waterQualityService = require('./service');

const recordWaterQualityMeasurement = async (req, res) => {
  try {
    const measurement = await waterQualityService.recordWaterQualityMeasurement(req.body);
    res.status(201).json({ success: true, data: measurement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getComplianceReport = async (req, res) => {
  try {
    const report = await waterQualityService.getComplianceReport(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const monitorWaterQuality = async (req, res) => {
  try {
    const monitoring = await waterQualityService.monitorWaterQuality(req.params.id);
    res.status(200).json({ success: true, data: monitoring });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateTreatmentRecommendations = async (req, res) => {
  try {
    const recommendations = await waterQualityService.generateTreatmentRecommendations(req.params.id, req.body);
    res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  recordWaterQualityMeasurement,
  getComplianceReport,
  monitorWaterQuality,
  generateTreatmentRecommendations
};
