/**
 * Public Domain Data Extraction Routes
 * 
 * Express routes for the Public Domain Data Extraction service,
 * providing endpoints for data source management, extraction jobs,
 * subsidy database operations, eligibility matching, and compliance tracking.
 */

const express = require('express');
const router = express.Router();
const publicDomainDataExtractionService = require('../services/publicDomainDataExtractionService');

/**
 * Data Source Management Routes
 */

// Get all data sources
router.get('/data-sources', (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      country: req.query.country,
      status: req.query.status,
      category: req.query.category
    };
    
    const sources = publicDomainDataExtractionService.getDataSources(filters);
    res.json({
      success: true,
      count: sources.length,
      data: sources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific data source
router.get('/data-sources/:sourceId', (req, res) => {
  try {
    const source = publicDomainDataExtractionService.getDataSource(req.params.sourceId);
    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Data source not found'
      });
    }
    res.json({
      success: true,
      data: source
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register a new data source
router.post('/data-sources', (req, res) => {
  try {
    const source = publicDomainDataExtractionService.registerDataSource(req.body);
    res.status(201).json({
      success: true,
      message: 'Data source registered successfully',
      data: source
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a data source
router.put('/data-sources/:sourceId', (req, res) => {
  try {
    const source = publicDomainDataExtractionService.updateDataSource(req.params.sourceId, req.body);
    res.json({
      success: true,
      message: 'Data source updated successfully',
      data: source
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a data source
router.delete('/data-sources/:sourceId', (req, res) => {
  try {
    const result = publicDomainDataExtractionService.deleteDataSource(req.params.sourceId);
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
 * Extraction Job Management Routes
 */

// Get all extraction jobs
router.get('/extraction-jobs', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      sourceId: req.query.sourceId
    };
    
    const jobs = publicDomainDataExtractionService.getExtractionJobs(filters);
    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific extraction job
router.get('/extraction-jobs/:jobId', (req, res) => {
  try {
    const job = publicDomainDataExtractionService.getExtractionJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Extraction job not found'
      });
    }
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new extraction job
router.post('/extraction-jobs', (req, res) => {
  try {
    const job = publicDomainDataExtractionService.createExtractionJob(req.body);
    res.status(201).json({
      success: true,
      message: 'Extraction job created successfully',
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start an extraction job
router.post('/extraction-jobs/:jobId/start', async (req, res) => {
  try {
    const job = await publicDomainDataExtractionService.startExtractionJob(req.params.jobId);
    res.json({
      success: true,
      message: 'Extraction job started successfully',
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel an extraction job
router.post('/extraction-jobs/:jobId/cancel', (req, res) => {
  try {
    const job = publicDomainDataExtractionService.cancelExtractionJob(req.params.jobId);
    res.json({
      success: true,
      message: 'Extraction job cancelled successfully',
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Processed Data Routes
 */

// Get processed data from an extraction job
router.get('/processed-data/:jobId', (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : null,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : null,
      year: req.query.year ? parseInt(req.query.year) : null,
      state: req.query.state
    };
    
    const data = publicDomainDataExtractionService.getProcessedData(req.params.jobId, filters);
    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Data Filter Routes
 */

// Get all data filters
router.get('/data-filters', (req, res) => {
  try {
    const filters = publicDomainDataExtractionService.getDataFilters();
    res.json({
      success: true,
      count: filters.length,
      data: filters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new data filter
router.post('/data-filters', (req, res) => {
  try {
    const filter = publicDomainDataExtractionService.createDataFilter(req.body);
    res.status(201).json({
      success: true,
      message: 'Data filter created successfully',
      data: filter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply a filter to data
router.post('/data-filters/:filterId/apply', (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Data array is required in request body'
      });
    }
    
    const filteredData = publicDomainDataExtractionService.applyFilterToData(req.params.filterId, data);
    res.json({
      success: true,
      count: filteredData.length,
      data: filteredData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Subsidy Database Routes
 */

// Get all subsidies
router.get('/subsidies', (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      state: req.query.state,
      ministry: req.query.ministry,
      verified: req.query.verified === 'true'
    };
    
    const subsidies = publicDomainDataExtractionService.getSubsidies(filters);
    res.json({
      success: true,
      count: subsidies.length,
      data: subsidies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific subsidy
router.get('/subsidies/:subsidyId', (req, res) => {
  try {
    const subsidy = publicDomainDataExtractionService.getSubsidy(req.params.subsidyId);
    if (!subsidy) {
      return res.status(404).json({
        success: false,
        error: 'Subsidy not found'
      });
    }
    res.json({
      success: true,
      data: subsidy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add a new subsidy
router.post('/subsidies', (req, res) => {
  try {
    const subsidy = publicDomainDataExtractionService.addSubsidy(req.body);
    res.status(201).json({
      success: true,
      message: 'Subsidy added successfully',
      data: subsidy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a subsidy
router.put('/subsidies/:subsidyId', (req, res) => {
  try {
    const subsidy = publicDomainDataExtractionService.updateSubsidy(req.params.subsidyId, req.body);
    res.json({
      success: true,
      message: 'Subsidy updated successfully',
      data: subsidy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a subsidy
router.delete('/subsidies/:subsidyId', (req, res) => {
  try {
    const result = publicDomainDataExtractionService.deleteSubsidy(req.params.subsidyId);
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
 * Eligibility Matching Routes
 */

// Match user profile against subsidies
router.post('/eligibility/match', (req, res) => {
  try {
    const { userProfile } = req.body;
    if (!userProfile) {
      return res.status(400).json({
        success: false,
        error: 'User profile is required in request body'
      });
    }
    
    const matches = publicDomainDataExtractionService.matchSubsidies(userProfile);
    res.json({
      success: true,
      count: matches.length,
      data: matches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Eligibility Rules Routes
 */

// Get all eligibility rules
router.get('/eligibility-rules', (req, res) => {
  try {
    const rules = publicDomainDataExtractionService.getEligibilityRules();
    res.json({
      success: true,
      count: rules.length,
      data: rules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add a new eligibility rule
router.post('/eligibility-rules', (req, res) => {
  try {
    const rule = publicDomainDataExtractionService.addEligibilityRule(req.body);
    res.status(201).json({
      success: true,
      message: 'Eligibility rule added successfully',
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update an eligibility rule
router.put('/eligibility-rules/:ruleId', (req, res) => {
  try {
    const rule = publicDomainDataExtractionService.updateEligibilityRule(req.params.ruleId, req.body);
    res.json({
      success: true,
      message: 'Eligibility rule updated successfully',
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete an eligibility rule
router.delete('/eligibility-rules/:ruleId', (req, res) => {
  try {
    const result = publicDomainDataExtractionService.deleteEligibilityRule(req.params.ruleId);
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
 * Compliance Routes
 */

// Get all compliance records
router.get('/compliance', (req, res) => {
  try {
    const filters = {
      sourceId: req.query.sourceId,
      legalBasis: req.query.legalBasis
    };
    
    const records = publicDomainDataExtractionService.getComplianceRecords(filters);
    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Record compliance information
router.post('/compliance', (req, res) => {
  try {
    const record = publicDomainDataExtractionService.recordCompliance(req.body);
    res.status(201).json({
      success: true,
      message: 'Compliance record created successfully',
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health and Statistics Routes
 */

// Get service health status
router.get('/health', (req, res) => {
  try {
    const health = publicDomainDataExtractionService.getHealthStatus();
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

// Get service statistics
router.get('/statistics', (req, res) => {
  try {
    const stats = publicDomainDataExtractionService.getStatistics();
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

module.exports = router;
