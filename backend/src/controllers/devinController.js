/**
 * Devin Copilot Controller
 * Handles Devin session management and task orchestration
 */

const devinService = require('../services/devinService');
const { logger } = require('../utils/logger');

class DevinController {
  /**
   * Get Devin service status
   */
  static async getStatus(req, res) {
    try {
      const status = devinService.getStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      logger.error('Failed to get Devin status', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Create a new Devin session
   */
  static async createSession(req, res) {
    try {
      const { prompt, title, tags } = req.body;
      if (!prompt) {
        return res.status(400).json({ success: false, error: 'Prompt is required' });
      }

      const session = await devinService.createSession(prompt, {
        title: title || 'EBDESIGN Session',
        tags: tags || [],
      });

      res.status(201).json({ success: true, data: session });
    } catch (error) {
      logger.error('Failed to create Devin session', error);
      res.status(error.message.includes('not configured') ? 503 : 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get Devin session details
   */
  static async getSession(req, res) {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'Session ID is required' });
      }

      const session = await devinService.getSession(sessionId);
      res.json({ success: true, data: session });
    } catch (error) {
      logger.error('Failed to get Devin session', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ success: false, error: error.message });
    }
  }

  /**
   * List active Devin sessions
   */
  static async listSessions(req, res) {
    try {
      const sessions = await devinService.listSessions();
      res.json({ success: true, data: { sessions, count: sessions.length } });
    } catch (error) {
      logger.error('Failed to list Devin sessions', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Send message to Devin session
   */
  static async sendMessage(req, res) {
    try {
      const { sessionId } = req.params;
      const { message } = req.body;

      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'Session ID is required' });
      }
      if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }

      const result = await devinService.sendMessage(sessionId, message);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Failed to send message', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Close Devin session
   */
  static async closeSession(req, res) {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'Session ID is required' });
      }

      await devinService.closeSession(sessionId);
      res.json({ success: true, message: 'Session closed successfully' });
    } catch (error) {
      logger.error('Failed to close Devin session', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Execute task through Devin
   */
  static async executeTask(req, res) {
    try {
      const { task } = req.body;
      if (!task) {
        return res.status(400).json({ success: false, error: 'Task is required' });
      }

      const result = await devinService.executeTask(task);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Failed to execute task', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = DevinController;
