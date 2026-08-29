/**
 * Devin Controller - Live Cognition Devin API Integration
 *
 * REST API controller for kicking off, polling, and messaging real Devin
 * agentic coding sessions.
 */

const devinService = require('../services/devinService');
const { logger } = require('../utils/logger');

const devinController = {
  /**
   * Create a new Devin session
   */
  createSession: async (req, res) => {
    try {
      const { prompt, ...options } = req.body;
      if (!prompt) {
        return res.status(400).json({ success: false, error: 'prompt is required' });
      }
      const result = await devinService.createSession(prompt, options);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating Devin session', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get status/details of an existing Devin session
   */
  getSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = await devinService.getSession(sessionId);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error getting Devin session', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Send a follow-up message to a running Devin session
   */
  sendMessage: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, error: 'message is required' });
      }
      const result = await devinService.sendMessage(sessionId, message);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error sending message to Devin session', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get Devin configuration/connectivity status
   */
  getStatus: async (req, res) => {
    try {
      const result = devinService.getStatus();
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error getting Devin status', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = devinController;
