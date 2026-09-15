/**
 * Devin Copilot Routes
 * Endpoints for Devin session management and task orchestration
 */

'use strict';

const express = require('express');
const DevinController = require('../controllers/devinController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All Devin routes require authentication
router.use(authMiddleware);

/**
 * GET /status
 * Get Devin service status and configuration
 */
router.get('/status', DevinController.getStatus);

/**
 * POST /sessions
 * Create a new Devin session with a handoff prompt
 * Body: { prompt, title?, tags? }
 */
router.post('/sessions', DevinController.createSession);

/**
 * GET /sessions
 * List all active Devin sessions
 */
router.get('/sessions', DevinController.listSessions);

/**
 * GET /sessions/:sessionId
 * Get details of a specific Devin session
 */
router.get('/sessions/:sessionId', DevinController.getSession);

/**
 * POST /sessions/:sessionId/messages
 * Send a message to a Devin session
 * Body: { message }
 */
router.post('/sessions/:sessionId/messages', DevinController.sendMessage);

/**
 * POST /sessions/:sessionId/close
 * Close a Devin session
 */
router.post('/sessions/:sessionId/close', DevinController.closeSession);

/**
 * POST /tasks
 * Execute a task through Devin
 * Body: { task }
 */
router.post('/tasks', DevinController.executeTask);

module.exports = router;
