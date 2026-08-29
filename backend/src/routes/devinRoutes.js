/**
 * Devin Routes - Live Cognition Devin API Integration
 *
 * REST API routes for creating, polling, and messaging real Devin
 * agentic coding sessions from within EBDESIGN.
 */

const express = require('express');
const devinController = require('../controllers/devinController');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authMiddleware);
router.use(rateLimiter);

// ============================================================================
// DEVIN ROUTES
// ============================================================================

router.get('/status', devinController.getStatus);
router.post('/sessions', devinController.createSession);
router.get('/sessions/:sessionId', devinController.getSession);
router.post('/sessions/:sessionId/message', devinController.sendMessage);

module.exports = router;
