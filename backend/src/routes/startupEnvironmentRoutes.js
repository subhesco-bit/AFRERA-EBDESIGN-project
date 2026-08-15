/**
 * Startup Environment Routes
 * 
 * Express routes for the Startup Environment service,
 * providing endpoints for startup management, incubation programs,
 * mentorship, funding, networking, and AI-powered recommendations.
 */

const express = require('express');
const router = express.Router();
const startupEnvironmentService = require('../services/startupEnvironmentService');

/**
 * Startup Management Routes
 */

// Get all startups
router.get('/startups', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      sector: req.query.sector,
      stage: req.query.stage,
      incubationProgramId: req.query.incubationProgramId
    };
    
    const startups = startupEnvironmentService.getStartups(filters);
    res.json({
      success: true,
      count: startups.length,
      data: startups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific startup
router.get('/startups/:startupId', (req, res) => {
  try {
    const startup = startupEnvironmentService.getStartup(req.params.startupId);
    if (!startup) {
      return res.status(404).json({
        success: false,
        error: 'Startup not found'
      });
    }
    res.json({
      success: true,
      data: startup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register a new startup
router.post('/startups', (req, res) => {
  try {
    const startup = startupEnvironmentService.registerStartup(req.body);
    res.status(201).json({
      success: true,
      message: 'Startup registered successfully',
      data: startup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a startup
router.put('/startups/:startupId', (req, res) => {
  try {
    const startup = startupEnvironmentService.updateStartup(req.params.startupId, req.body);
    res.json({
      success: true,
      message: 'Startup updated successfully',
      data: startup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Incubation Program Routes
 */

// Get all incubation programs
router.get('/incubation-programs', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      sector: req.query.sector
    };
    
    const programs = startupEnvironmentService.getIncubationPrograms(filters);
    res.json({
      success: true,
      count: programs.length,
      data: programs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new incubation program
router.post('/incubation-programs', (req, res) => {
  try {
    const program = startupEnvironmentService.createIncubationProgram(req.body);
    res.status(201).json({
      success: true,
      message: 'Incubation program created successfully',
      data: program
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply for incubation program
router.post('/incubation-programs/:programId/apply', (req, res) => {
  try {
    const application = startupEnvironmentService.applyForIncubation(req.params.programId, req.body);
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Mentorship Routes
 */

// Get all mentors
router.get('/mentors', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      expertise: req.query.expertise,
      availability: req.query.availability
    };
    
    const mentors = startupEnvironmentService.getMentors(filters);
    res.json({
      success: true,
      count: mentors.length,
      data: mentors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new mentor
router.post('/mentors', (req, res) => {
  try {
    const mentor = startupEnvironmentService.createMentor(req.body);
    res.status(201).json({
      success: true,
      message: 'Mentor created successfully',
      data: mentor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Assign mentor to startup
router.post('/startups/:startupId/assign-mentor/:mentorId', (req, res) => {
  try {
    const result = startupEnvironmentService.assignMentor(req.params.startupId, req.params.mentorId);
    res.json({
      success: true,
      message: 'Mentor assigned successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Funding Routes
 */

// Get all funding opportunities
router.get('/funding', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      sector: req.query.sector,
      type: req.query.type,
      stage: req.query.stage
    };
    
    const opportunities = startupEnvironmentService.getFundingOpportunities(filters);
    res.json({
      success: true,
      count: opportunities.length,
      data: opportunities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new funding opportunity
router.post('/funding', (req, res) => {
  try {
    const funding = startupEnvironmentService.createFundingOpportunity(req.body);
    res.status(201).json({
      success: true,
      message: 'Funding opportunity created successfully',
      data: funding
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply for funding
router.post('/funding/:fundingId/apply', (req, res) => {
  try {
    const application = startupEnvironmentService.applyForFunding(req.params.fundingId, req.body);
    res.status(201).json({
      success: true,
      message: 'Funding application submitted successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Resource Allocation Routes
 */

// Allocate resources to startup
router.post('/startups/:startupId/resources', (req, res) => {
  try {
    const allocation = startupEnvironmentService.allocateResources(req.params.startupId, req.body);
    res.status(201).json({
      success: true,
      message: 'Resources allocated successfully',
      data: allocation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Networking Event Routes
 */

// Get all networking events
router.get('/networking-events', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type
    };
    
    const events = startupEnvironmentService.getNetworkingEvents(filters);
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new networking event
router.post('/networking-events', (req, res) => {
  try {
    const event = startupEnvironmentService.createNetworkingEvent(req.body);
    res.status(201).json({
      success: true,
      message: 'Networking event created successfully',
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register for networking event
router.post('/networking-events/:eventId/register', (req, res) => {
  try {
    const event = startupEnvironmentService.registerForEvent(req.params.eventId, req.body.startupId);
    res.json({
      success: true,
      message: 'Registration successful',
      data: event
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
    const { startupId, recommendationType } = req.body;
    if (!startupId || !recommendationType) {
      return res.status(400).json({
        success: false,
        error: 'startupId and recommendationType are required in request body'
      });
    }
    
    const recommendations = await startupEnvironmentService.generateAIRecommendations(startupId, recommendationType);
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
 * Progress Tracking Routes
 */

// Track startup progress
router.post('/startups/:startupId/progress', (req, res) => {
  try {
    const progress = startupEnvironmentService.trackProgress(req.params.startupId, req.body);
    res.status(201).json({
      success: true,
      message: 'Progress recorded successfully',
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get startup progress history
router.get('/startups/:startupId/progress', (req, res) => {
  try {
    const progress = startupEnvironmentService.getStartupProgress(req.params.startupId);
    res.json({
      success: true,
      count: progress.length,
      data: progress
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

// Get startup environment analytics
router.get('/analytics', (req, res) => {
  try {
    const analytics = startupEnvironmentService.getAnalytics();
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
    const health = startupEnvironmentService.getHealthStatus();
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
