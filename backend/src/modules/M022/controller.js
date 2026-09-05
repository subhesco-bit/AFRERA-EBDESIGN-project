/**
 * Controller for Farmer Profile (M022)
 * Handles HTTP requests for farmer profile operations
 */

const farmerProfileService = require('./service');

const createProfile = async (req, res) => {
  try {
    const profile = await farmerProfileService.createProfile(req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    let profile = await farmerProfileService.getProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getProfileByFarmerId = async (req, res) => {
  try {
    let profile = await farmerProfileService.getProfileByFarmerId(req.params.farmerId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const listProfiles = async (req, res) => {
  try {
    const profiles = await farmerProfileService.listProfiles(req.query);
    res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    let profile = await farmerProfileService.updateProfile(req.params.id, req.body);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addContactInfo = async (req, res) => {
  try {
    const contact = await farmerProfileService.addContactInfo(req.params.id, req.body);
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addHouseholdMember = async (req, res) => {
  try {
    const member = await farmerProfileService.addHouseholdMember(req.params.id, req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addSkill = async (req, res) => {
  try {
    const skill = await farmerProfileService.addSkill(req.params.id, req.body);
    res.status(201).json({ success: true, data: skill });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const enrichProfile = async (req, res) => {
  try {
    const enrichment = await farmerProfileService.enrichProfile(req.params.id);
    res.status(200).json({ success: true, data: enrichment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const analyzeProfileCompleteness = async (req, res) => {
  try {
    const analysis = await farmerProfileService.analyzeProfileCompleteness(req.params.id);
    res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getFullProfile = async (req, res) => {
  try {
    const fullProfile = await farmerProfileService.getFullProfile(req.params.id);
    if (!fullProfile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    res.status(200).json({ success: true, data: fullProfile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createProfile,
  getProfile,
  getProfileByFarmerId,
  listProfiles,
  updateProfile,
  addContactInfo,
  addHouseholdMember,
  addSkill,
  enrichProfile,
  analyzeProfileCompleteness,
  getFullProfile
};
