/**
 * Knowledge Routes
 * 
 * Express routes for the Knowledge service,
 * providing endpoints for knowledge articles, wiki pages, taxonomies,
 * search, version control, access control, feedback, and AI recommendations.
 */

const express = require('express');
const router = express.Router();
const knowledgeService = require('../services/knowledgeService');

/**
 * Article Management Routes
 */

// Get all articles
router.get('/articles', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      taxonomyId: req.query.taxonomyId,
      authorId: req.query.authorId,
      featured: req.query.featured,
      tag: req.query.tag,
      language: req.query.language,
      sortBy: req.query.sortBy
    };
    
    const articles = knowledgeService.getArticles(filters);
    res.json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific article
router.get('/articles/:articleId', (req, res) => {
  try {
    const article = knowledgeService.getArticle(req.params.articleId);
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new article
router.post('/articles', (req, res) => {
  try {
    const article = knowledgeService.createArticle(req.body);
    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update an article
router.put('/articles/:articleId', (req, res) => {
  try {
    const article = knowledgeService.updateArticle(req.params.articleId, req.body);
    res.json({
      success: true,
      message: 'Article updated successfully',
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete an article
router.delete('/articles/:articleId', (req, res) => {
  try {
    const result = knowledgeService.deleteArticle(req.params.articleId);
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
 * Wiki Page Management Routes
 */

// Get all wiki pages
router.get('/wiki', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      parentId: req.query.parentId,
      authorId: req.query.authorId
    };
    
    const pages = knowledgeService.getWikiPages(filters);
    res.json({
      success: true,
      count: pages.length,
      data: pages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get wiki page by slug
router.get('/wiki/slug/:slug', (req, res) => {
  try {
    const page = knowledgeService.getWikiPageBySlug(req.params.slug);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Wiki page not found'
      });
    }
    res.json({
      success: true,
      data: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new wiki page
router.post('/wiki', (req, res) => {
  try {
    const page = knowledgeService.createWikiPage(req.body);
    res.status(201).json({
      success: true,
      message: 'Wiki page created successfully',
      data: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a wiki page
router.put('/wiki/:wikiId', (req, res) => {
  try {
    const page = knowledgeService.updateWikiPage(req.params.wikiId, req.body);
    res.json({
      success: true,
      message: 'Wiki page updated successfully',
      data: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Taxonomy Management Routes
 */

// Get all taxonomies
router.get('/taxonomies', (req, res) => {
  try {
    const filters = {
      parentId: req.query.parentId,
      level: req.query.level
    };
    
    const taxonomies = knowledgeService.getTaxonomies(filters);
    res.json({
      success: true,
      count: taxonomies.length,
      data: taxonomies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get taxonomy tree
router.get('/taxonomies/tree', (req, res) => {
  try {
    const rootId = req.query.rootId || null;
    const tree = knowledgeService.getTaxonomyTree(rootId);
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

// Create a new taxonomy
router.post('/taxonomies', (req, res) => {
  try {
    const taxonomy = knowledgeService.createTaxonomy(req.body);
    res.status(201).json({
      success: true,
      message: 'Taxonomy created successfully',
      data: taxonomy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Search Routes
 */

// Search knowledge base
router.get('/search', (req, res) => {
  try {
    const query = req.query.q;
    const filters = {
      type: req.query.type
    };
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }
    
    const results = knowledgeService.searchKnowledge(query, filters);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Version Control Routes
 */

// Get version history for an item
router.get('/versions/:itemId', (req, res) => {
  try {
    const history = knowledgeService.getVersionHistory(req.params.itemId);
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Restore a specific version
router.post('/versions/:itemId/restore/:versionNumber', (req, res) => {
  try {
    const item = knowledgeService.restoreVersion(req.params.itemId, parseInt(req.params.versionNumber));
    res.json({
      success: true,
      message: 'Version restored successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Access Control Routes
 */

// Set access control
router.post('/access-control', (req, res) => {
  try {
    const control = knowledgeService.setAccessControl(req.body);
    res.status(201).json({
      success: true,
      message: 'Access control set successfully',
      data: control
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check access permission
router.get('/access-control/:resourceId/check/:userId', (req, res) => {
  try {
    const requiredPermission = req.query.permission || 'read';
    const hasAccess = knowledgeService.checkAccess(
      req.params.resourceId,
      req.params.userId,
      requiredPermission
    );
    res.json({
      success: true,
      hasAccess: hasAccess
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Feedback Routes
 */

// Submit feedback
router.post('/feedback', (req, res) => {
  try {
    const feedback = knowledgeService.submitFeedback(req.body);
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get feedback for a resource
router.get('/feedback/:resourceId', (req, res) => {
  try {
    const feedback = knowledgeService.getFeedback(req.params.resourceId);
    res.json({
      success: true,
      count: feedback.length,
      data: feedback
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
    
    const recommendations = await knowledgeService.generateAIRecommendations(userId, context);
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
 * Analytics Routes
 */

// Get knowledge analytics
router.get('/analytics', (req, res) => {
  try {
    const analytics = knowledgeService.getAnalytics();
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
    const health = knowledgeService.getHealthStatus();
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
