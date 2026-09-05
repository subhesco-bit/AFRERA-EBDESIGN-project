/**
 * Library Knowledge Routes
 * API endpoints for library browsing and AI integration
 */

const express = require('express.js');
const router = express.Router();
const libraryKnowledgeService = require('../../services/legacy/libraryKnowledgeService.js');

/**
 * Initialize library service
 */
router.post('/initialize', async (req, res) => {
  try {
    await libraryKnowledgeService.initialize();
    res.json({
      success: true,
      message: 'Library service initialized successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Search library
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }

    const results = await libraryKnowledgeService.searchLibrary(query);
    
    res.json({
      success: true,
      data: {
        query,
        results,
        count: results.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get library statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await libraryKnowledgeService.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Verify catalog integrity
 */
router.get('/verify', async (req, res) => {
  try {
    const verification = await libraryKnowledgeService.verifyCatalogIntegrity();
    
    res.json({
      success: true,
      data: verification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get specific library item
 */
router.get('/item/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const item = libraryKnowledgeService.index.get(filename);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Library item not found'
      });
    }

    res.json({
      success: true,
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
 * Get all modules
 */
router.get('/modules', async (req, res) => {
  try {
    const modules = [];
    
    for (const [filename, item] of libraryKnowledgeService.index) {
      if (item.type === 'module') {
        modules.push({
          filename,
          data: item.data,
          lastModified: item.lastModified
        });
      }
    }

    res.json({
      success: true,
      data: {
        modules,
        count: modules.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all components
 */
router.get('/components', async (req, res) => {
  try {
    const components = [];
    
    for (const [filename, item] of libraryKnowledgeService.index) {
      if (item.type === 'component') {
        components.push({
          filename,
          data: item.data,
          lastModified: item.lastModified
        });
      }
    }

    res.json({
      success: true,
      data: {
        components,
        count: components.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
