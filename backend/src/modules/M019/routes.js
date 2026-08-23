const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');
// :userId is caller-supplied; without this every profile route below was
// addressable for any other user's id by any logged-in account.
const { requireSelfOrAdmin } = require('../../middleware/ownership');

// Profile CRUD
router.post('/profiles', authMiddleware, controller.createProfile);
router.get('/profiles/:userId', authMiddleware, requireSelfOrAdmin('userId'), controller.getProfile);
router.get('/profiles', authMiddleware, controller.getProfile);
router.put('/profiles/:userId', authMiddleware, requireSelfOrAdmin('userId'), controller.updateProfile);
router.put('/profiles', authMiddleware, controller.updateProfile);
router.delete('/profiles/:userId', authMiddleware, requireSelfOrAdmin('userId'), controller.deleteProfile);

// Profile enrichment
router.post('/profiles/:userId/enrich', authMiddleware, requireSelfOrAdmin('userId'), controller.enrichProfile);

// AI-powered completion
router.get('/profiles/:userId/completion', authMiddleware, requireSelfOrAdmin('userId'), controller.suggestProfileCompletion);
router.get('/profiles/completion', authMiddleware, controller.suggestProfileCompletion);

// Social media integration
router.post('/profiles/social/link', authMiddleware, controller.linkSocialAccount);
router.post('/profiles/social/unlink', authMiddleware, controller.unlinkSocialAccount);

// Visibility controls
router.post('/profiles/visibility', authMiddleware, controller.setProfileVisibility);
router.get('/profiles/:userId/visibility', authMiddleware, requireSelfOrAdmin('userId'), controller.getProfileVisibility);
router.get('/profiles/visibility', authMiddleware, controller.getProfileVisibility);

// Activity tracking
router.post('/profiles/activity', authMiddleware, controller.logProfileActivity);
router.get('/profiles/:userId/activity', authMiddleware, requireSelfOrAdmin('userId'), controller.getProfileActivity);
router.get('/profiles/activity', authMiddleware, controller.getProfileActivity);

// Search and discovery
router.get('/profiles/search', authMiddleware, controller.searchProfiles);
router.get('/profiles/:userId/recommendations', authMiddleware, requireSelfOrAdmin('userId'), controller.getProfileRecommendations);
router.get('/profiles/recommendations', authMiddleware, controller.getProfileRecommendations);

// Analytics
router.get('/profiles/:userId/analytics', authMiddleware, requireSelfOrAdmin('userId'), controller.getProfileAnalytics);
router.get('/profiles/analytics', authMiddleware, controller.getProfileAnalytics);

// Bulk operations
router.post('/profiles/bulk-update', authMiddleware, requireRole('admin'), controller.bulkUpdateProfiles);

module.exports = router;