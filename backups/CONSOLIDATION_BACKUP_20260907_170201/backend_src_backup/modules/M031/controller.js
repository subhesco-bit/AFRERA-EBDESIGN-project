/**
 * Controller for Land Registry (M031)
 */

const landRegistryService = require('./service');

const createLandParcel = async (req, res) => {
  try {
    const parcel = await landRegistryService.createLandParcel(req.body);
    res.status(201).json({ success: true, data: parcel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const transferLandOwnership = async (req, res) => {
  try {
    const transfer = await landRegistryService.transferLandOwnership(req.params.parcelId, req.body.from_farmer_id, req.body.to_farmer_id, req.body);
    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getLandByFarmer = async (req, res) => {
  try {
    const land = await landRegistryService.getLandByFarmer(req.params.farmerId);
    res.status(200).json({ success: true, data: land });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getLandAnalytics = async (req, res) => {
  try {
    const analytics = await landRegistryService.getLandAnalytics(req.query);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createLandParcel,
  transferLandOwnership,
  getLandByFarmer,
  getLandAnalytics
};
