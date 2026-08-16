/**
 * Controller for Soil Analysis (M032)
 */

const soilAnalysisService = require('./service');

const createSoilSample = async (req, res) => {
  try {
    const sample = await soilAnalysisService.createSoilSample(req.body);
    res.status(201).json({ success: true, data: sample });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSoilRecommendations = async (req, res) => {
  try {
    const recommendations = await soilAnalysisService.getSoilRecommendations(req.params.farmerId, req.params.parcelId);
    res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createSoilSample,
  getSoilRecommendations
};
