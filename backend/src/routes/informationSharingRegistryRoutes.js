/**
 * Information Sharing Registry Routes — REST wrapper for
 * services/legacy/informationSharingService.js, a real, complete
 * in-memory service (documents, folders, permissions, sharing links,
 * collaboration sessions, AI recommendations, activity logs, analytics,
 * health) matching InformationSharingPage.jsx's ~20 ActionCard calls
 * almost exactly - the previously-mounted routes/informationSharingRoutes.js
 * was a dead "Route operational" scaffold with no connection to this
 * service at all, and routes/platform/informationSharingRoutes_merged.js
 * (also never mounted) is a much thinner generic CRUD scaffold that
 * doesn't match this page's real needs either - neither is touched here.
 */

'use strict';

const express = require('express');
const service = require('../services/legacy/informationSharingService');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

const router = express.Router();

router.use(authMiddleware);
router.use(apiLimiter);

function handle(label, fn) {
  return async (req, res, next) => {
    try {
      const result = await fn(req, res);
      if (result === undefined) return; // handler already sent a response
      if (result === null) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error(`informationSharingRegistryRoutes:${label}`, { error: error.message });
      next(error);
    }
  };
}

router.get('/documents', handle('getDocuments', (req) => service.getDocuments(req.query)));
router.get('/documents/search', handle('searchDocuments', (req) => service.searchDocuments(req.query.q, req.query)));
router.get('/documents/:id', handle('getDocument', (req) => service.getDocument(req.params.id)));
router.post('/documents', handle('createDocument', (req) => service.createDocument(req.body)));
router.put('/documents/:id', handle('updateDocument', (req) => service.updateDocument(req.params.id, req.body)));
router.delete('/documents/:id', handle('deleteDocument', (req) => service.deleteDocument(req.params.id)));

router.get('/folders', handle('getFolders', (req) => service.getFolders(req.query)));
router.get('/folders/tree', handle('getFolderTree', (req) => service.getFolderTree(req.query.rootId || null)));
router.post('/folders', handle('createFolder', (req) => service.createFolder(req.body)));

router.get('/permissions', handle('getPermissions', (req) => service.getPermissions(req.query.resourceId, req.query.resourceType)));
router.get('/permissions/check', handle('checkPermission', (req) => service.checkPermission(req.query.resourceId, req.query.userId, req.query.permission)));
router.post('/permissions', handle('setPermission', (req) => service.setPermission(req.body)));

router.post('/sharing-links', handle('createSharingLink', (req) => service.createSharingLink(req.body)));
router.get('/sharing-links/access', handle('accessSharingLink', (req) => service.getSharingLinkByToken(req.query.token)));

router.get('/collaboration-sessions', handle('getCollaborationSessions', (req) => service.getCollaborationSessions(req.query)));
router.post('/collaboration-sessions', handle('createCollaborationSession', (req) => service.createCollaborationSession(req.body)));
router.post('/collaboration-sessions/:id/join', handle('joinCollaborationSession', (req) => service.joinCollaborationSession(req.params.id, req.body.userId)));
router.post('/collaboration-sessions/:id/end', handle('endCollaborationSession', (req) => service.endCollaborationSession(req.params.id)));

router.post('/ai-recommendations', handle('generateAIRecommendations', (req) => service.generateAIRecommendations(req.body.userId, req.body.context || {})));

router.get('/activity-logs', handle('getActivityLogs', (req) => service.getActivityLogs(req.query.resourceId)));
router.get('/analytics', handle('getAnalytics', () => service.getAnalytics()));
router.get('/health-status', handle('getHealthStatus', () => service.getHealthStatus()));

module.exports = router;
