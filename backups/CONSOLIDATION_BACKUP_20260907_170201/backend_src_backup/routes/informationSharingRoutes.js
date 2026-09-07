/**
 * Information Sharing Routes
 * 
 * Express routes for the Information Sharing service,
 * providing endpoints for document management, folder organization,
 * permissions, sharing, collaboration, and AI recommendations.
 */

const express = require('express');
const router = express.Router();
const informationSharingService = require('../services/legacy/informationSharingService');

/**
 * Document Management Routes
 */

// Get all documents
router.get('/documents', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      category: req.query.category,
      type: req.query.type,
      ownerId: req.query.ownerId,
      folderId: req.query.folderId,
      tag: req.query.tag
    };
    
    const documents = informationSharingService.getDocuments(filters);
    res.json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search documents
// NOTE: must be registered before '/documents/:documentId' - otherwise Express
// matches "search" as a :documentId and this route is unreachable (found
// 2026-08-29 while wiring the frontend for informationSharingRoutes.js).
router.get('/documents/search', (req, res) => {
  try {
    const query = req.query.q;
    const filters = {
      status: req.query.status,
      category: req.query.category,
      type: req.query.type
    };

    const documents = informationSharingService.searchDocuments(query, filters);
    res.json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific document
router.get('/documents/:documentId', (req, res) => {
  try {
    const document = informationSharingService.getDocument(req.params.documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new document
router.post('/documents', (req, res) => {
  try {
    const document = informationSharingService.createDocument(req.body);
    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a document
router.put('/documents/:documentId', (req, res) => {
  try {
    const document = informationSharingService.updateDocument(req.params.documentId, req.body);
    res.json({
      success: true,
      message: 'Document updated successfully',
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a document
router.delete('/documents/:documentId', (req, res) => {
  try {
    const result = informationSharingService.deleteDocument(req.params.documentId);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Folder Management Routes
 */

// Get all folders
router.get('/folders', (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      ownerId: req.query.ownerId,
      parentId: req.query.parentId
    };
    
    const folders = informationSharingService.getFolders(filters);
    res.json({
      success: true,
      count: folders.length,
      data: folders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get folder tree
router.get('/folders/tree', (req, res) => {
  try {
    const rootId = req.query.rootId || null;
    const tree = informationSharingService.getFolderTree(rootId);
    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new folder
router.post('/folders', (req, res) => {
  try {
    const folder = informationSharingService.createFolder(req.body);
    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: folder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Permission Management Routes
 */

// Get permissions for a resource
router.get('/permissions/:resourceId', (req, res) => {
  try {
    const resourceType = req.query.resourceType || 'document';
    const permissions = informationSharingService.getPermissions(req.params.resourceId, resourceType);
    res.json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Set permission
router.post('/permissions', (req, res) => {
  try {
    const permission = informationSharingService.setPermission(req.body);
    res.status(201).json({
      success: true,
      message: 'Permission granted successfully',
      data: permission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check permission
router.get('/permissions/:resourceId/check/:userId', (req, res) => {
  try {
    const requiredPermission = req.query.permission || 'read';
    const hasPermission = informationSharingService.checkPermission(
      req.params.resourceId,
      req.params.userId,
      requiredPermission
    );
    res.json({
      success: true,
      hasPermission: hasPermission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Sharing Link Routes
 */

// Create sharing link
router.post('/sharing-links', (req, res) => {
  try {
    const link = informationSharingService.createSharingLink(req.body);
    res.status(201).json({
      success: true,
      message: 'Sharing link created successfully',
      data: link
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Access resource via sharing link
router.get('/sharing-links/access/:token', (req, res) => {
  try {
    const link = informationSharingService.getSharingLinkByToken(req.params.token);
    if (!link) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired sharing link'
      });
    }
    res.json({
      success: true,
      data: link
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Collaboration Routes
 */

// Get all collaboration sessions
router.get('/collaboration-sessions', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      resourceId: req.query.resourceId
    };
    
    const sessions = informationSharingService.getCollaborationSessions(filters);
    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create collaboration session
router.post('/collaboration-sessions', (req, res) => {
  try {
    const session = informationSharingService.createCollaborationSession(req.body);
    res.status(201).json({
      success: true,
      message: 'Collaboration session created successfully',
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Join collaboration session
router.post('/collaboration-sessions/:sessionId/join', (req, res) => {
  try {
    const session = informationSharingService.joinCollaborationSession(req.params.sessionId, req.body.userId);
    res.json({
      success: true,
      message: 'Joined session successfully',
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// End collaboration session
router.post('/collaboration-sessions/:sessionId/end', (req, res) => {
  try {
    const session = informationSharingService.endCollaborationSession(req.params.sessionId);
    res.json({
      success: true,
      message: 'Session ended successfully',
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * AI Recommendation Routes
 */

// Generate AI recommendations
router.post('/ai-recommendations', async (req, res) => {
  try {
    const { userId, context } = req.body;
    if (!userId || !context) {
      return res.status(400).json({
        success: false,
        error: 'userId and context are required in request body'
      });
    }
    
    const recommendations = await informationSharingService.generateAIRecommendations(userId, context);
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Activity Log Routes
 */

// Get activity logs for a resource
router.get('/activity-logs/:resourceId', (req, res) => {
  try {
    const logs = informationSharingService.getActivityLogs(req.params.resourceId);
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analytics Routes
 */

// Get sharing analytics
router.get('/analytics', (req, res) => {
  try {
    const analytics = informationSharingService.getAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health Route
 */

// Get service health status
router.get('/health', (req, res) => {
  try {
    const health = informationSharingService.getHealthStatus();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
