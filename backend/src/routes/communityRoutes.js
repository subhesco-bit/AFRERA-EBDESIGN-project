/**
 * Community Routes
 * 
 * Express routes for the Community service,
 * providing endpoints for member management, forums, discussions,
 * groups, events, moderation, gamification, and AI insights.
 */

const express = require('express');
const router = express.Router();
const communityService = require('../services/communityService');

/**
 * Member Management Routes
 */

// Get all members
router.get('/members', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      role: req.query.role,
      badge: req.query.badge,
      sortBy: req.query.sortBy
    };
    
    const members = communityService.getMembers(filters);
    res.json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific member
router.get('/members/:memberId', (req, res) => {
  try {
    const member = communityService.getMember(req.params.memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }
    res.json({
      success: true,
      data: member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register a new member
router.post('/members', (req, res) => {
  try {
    const member = communityService.registerMember(req.body);
    res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update member profile
router.put('/members/:memberId', (req, res) => {
  try {
    const member = communityService.updateMember(req.params.memberId, req.body);
    res.json({
      success: true,
      message: 'Member profile updated successfully',
      data: member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Category Management Routes
 */

// Get all categories
router.get('/categories', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      parentId: req.query.parentId
    };
    
    const categories = communityService.getCategories(filters);
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new category
router.post('/categories', (req, res) => {
  try {
    const category = communityService.createCategory(req.body);
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Thread Management Routes
 */

// Get all threads
router.get('/threads', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      categoryId: req.query.categoryId,
      authorId: req.query.authorId,
      tag: req.query.tag,
      isPinned: req.query.isPinned
    };
    
    const threads = communityService.getThreads(filters);
    res.json({
      success: true,
      count: threads.length,
      data: threads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific thread
router.get('/threads/:threadId', (req, res) => {
  try {
    const thread = communityService.getThread(req.params.threadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found'
      });
    }
    res.json({
      success: true,
      data: thread
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new thread
router.post('/threads', (req, res) => {
  try {
    const thread = communityService.createThread(req.body);
    res.status(201).json({
      success: true,
      message: 'Thread created successfully',
      data: thread
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Post Management Routes
 */

// Get posts for a thread
router.get('/threads/:threadId/posts', (req, res) => {
  try {
    const posts = communityService.getPosts(req.params.threadId);
    res.json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new post
router.post('/posts', (req, res) => {
  try {
    const post = communityService.createPost(req.body);
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Like Routes
 */

// Like a thread or post
router.post('/like', (req, res) => {
  try {
    const { itemId, itemType, userId } = req.body;
    const item = communityService.likeItem(itemId, itemType, userId);
    res.json({
      success: true,
      message: 'Like recorded successfully',
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
 * Group Management Routes
 */

// Get all groups
router.get('/groups', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      memberId: req.query.memberId
    };
    
    const groups = communityService.getGroups(filters);
    res.json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new group
router.post('/groups', (req, res) => {
  try {
    const group = communityService.createGroup(req.body);
    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Join a group
router.post('/groups/:groupId/join', (req, res) => {
  try {
    const group = communityService.joinGroup(req.params.groupId, req.body.userId);
    res.json({
      success: true,
      message: 'Joined group successfully',
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Event Management Routes
 */

// Get all events
router.get('/events', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type
    };
    
    const events = communityService.getEvents(filters);
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

// Create a new event
router.post('/events', (req, res) => {
  try {
    const event = communityService.createEvent(req.body);
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register for an event
router.post('/events/:eventId/register', (req, res) => {
  try {
    const event = communityService.registerForEvent(req.params.eventId, req.body.userId);
    res.json({
      success: true,
      message: 'Registered for event successfully',
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
 * Moderation Routes
 */

// Get moderation queue
router.get('/moderation', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      assignedTo: req.query.assignedTo
    };
    
    const queue = communityService.getModerationQueue(filters);
    res.json({
      success: true,
      count: queue.length,
      data: queue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add item to moderation queue
router.post('/moderation', (req, res) => {
  try {
    const queueItem = communityService.addToModerationQueue(req.body);
    res.status(201).json({
      success: true,
      message: 'Item added to moderation queue',
      data: queueItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Process moderation item
router.put('/moderation/:queueId', (req, res) => {
  try {
    const item = communityService.processModeration(req.params.queueId, req.body);
    res.json({
      success: true,
      message: 'Moderation item processed successfully',
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
 * Gamification Routes
 */

// Award badge to member
router.post('/members/:memberId/badges', (req, res) => {
  try {
    const member = communityService.awardBadge(req.params.memberId, req.body.badge);
    res.json({
      success: true,
      message: 'Badge awarded successfully',
      data: member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * AI Insights Routes
 */

// Generate AI community insights
router.post('/ai-insights', async (req, res) => {
  try {
    const { insightType } = req.body;
    if (!insightType) {
      return res.status(400).json({
        success: false,
        error: 'insightType is required in request body'
      });
    }
    
    const insights = await communityService.generateAIInsights(insightType);
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Activity Feed Routes
 */

// Get activity feed
router.get('/activity-feed', (req, res) => {
  try {
    const filters = {
      userId: req.query.userId,
      action: req.query.action,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };
    
    const activities = communityService.getActivityFeed(filters);
    res.json({
      success: true,
      count: activities.length,
      data: activities
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

// Get community analytics
router.get('/analytics', (req, res) => {
  try {
    const analytics = communityService.getAnalytics();
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
    const health = communityService.getHealthStatus();
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
