/**
 * Controller for Farmer Subsidies (M025)
 */

const farmerSubsidiesService = require('./service');

const createSubsidyScheme = async (req, res) => {
  try {
    const scheme = await farmerSubsidiesService.createSubsidyScheme(req.body);
    res.status(201).json({ success: true, data: scheme });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const applyForSubsidy = async (req, res) => {
  try {
    const application = await farmerSubsidiesService.applyForSubsidy(req.params.schemeId, req.body.farmer_id, req.body);
    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRecommendedSubsidies = async (req, res) => {
  try {
    const recommendations = await farmerSubsidiesService.getRecommendedSubsidies(req.params.farmerId);
    res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createSubsidyScheme,
  applyForSubsidy,
  getRecommendedSubsidies
};
