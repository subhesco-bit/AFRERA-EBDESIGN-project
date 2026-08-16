// Controller for Profile Management (M019) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// Profile CRUD
async function createProfile(req, res) {
  try {
    const profile = await service.createProfile(req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    logger.error('createProfile error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getProfile(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const profile = await service.getProfile(userId);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
    res.json({ success: true, data: profile });
  } catch (error) {
    logger.error('getProfile error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const profile = await service.updateProfile(userId, req.body);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
    res.json({ success: true, data: profile });
  } catch (error) {
    logger.error('updateProfile error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteProfile(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const deleted = await service.deleteProfile(userId);
    if (!deleted) return res.status(404).json({ success: false, error: 'Profile not found' });
    res.json({ success: true });
  } catch (error) {
    logger.error('deleteProfile error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Profile enrichment
async function enrichProfile(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const result = await service.enrichProfile(userId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('enrichProfile error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered completion
async function suggestProfileCompletion(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const suggestions = await service.suggestProfileCompletion(userId);
    res.json({ success: true, data: suggestions });
  } catch (error) {
    logger.error('suggestProfileCompletion error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Social media integration
async function linkSocialAccount(req, res) {
  try {
    const userId = req.user?.id;
    const { platform, accountData } = req.body;
    const result = await service.linkSocialAccount(userId, platform, accountData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('linkSocialAccount error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function unlinkSocialAccount(req, res) {
  try {
    const userId = req.user?.id;
    const { platform } = req.body;
    const result = await service.unlinkSocialAccount(userId, platform);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('unlinkSocialAccount error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Visibility controls
async function setProfileVisibility(req, res) {
  try {
    const userId = req.user?.id;
    const result = await service.setProfileVisibility(userId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('setProfileVisibility error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getProfileVisibility(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const result = await service.getProfileVisibility(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('getProfileVisibility error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Activity tracking
async function logProfileActivity(req, res) {
  try {
    const userId = req.user?.id;
    const { activityType, details } = req.body;
    await service.logProfileActivity(userId, activityType, details);
    res.json({ success: true });
  } catch (error) {
    logger.error('logProfileActivity error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getProfileActivity(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const { limit } = req.query;
    const activity = await service.getProfileActivity(userId, { limit });
    res.json({ success: true, data: activity });
  } catch (error) {
    logger.error('getProfileActivity error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Search and discovery
async function searchProfiles(req, res) {
  try {
    const results = await service.searchProfiles(req.query);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('searchProfiles error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getProfileRecommendations(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const recommendations = await service.getProfileRecommendations(userId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    logger.error('getProfileRecommendations error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Analytics
async function getProfileAnalytics(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const analytics = await service.getProfileAnalytics(userId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getProfileAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Bulk operations
async function bulkUpdateProfiles(req, res) {
  try {
    const { updates } = req.body;
    const result = await service.bulkUpdateProfiles(updates);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('bulkUpdateProfiles error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  // Profile CRUD
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
  
  // Profile enrichment
  enrichProfile,
  
  // AI-powered completion
  suggestProfileCompletion,
  
  // Social media integration
  linkSocialAccount,
  unlinkSocialAccount,
  
  // Visibility controls
  setProfileVisibility,
  getProfileVisibility,
  
  // Activity tracking
  logProfileActivity,
  getProfileActivity,
  
  // Search and discovery
  searchProfiles,
  getProfileRecommendations,
  
  // Analytics
  getProfileAnalytics,
  
  // Bulk operations
  bulkUpdateProfiles,
};