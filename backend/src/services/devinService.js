/**
 * Devin Copilot Integration Service
 * Manages Devin session creation and task orchestration
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

class DevinService {
  constructor() {
    // Try multiple Devin API endpoints
    this.apiBaseUrl = process.env.DEVIN_API_URL || 'https://api.devin.ai/v1';
    this.sessions = new Map();
  }

  /**
   * Get current API key (dynamic, reads from process.env each time)
   */
  get apiKey() {
    return process.env.DEVIN_API_KEY;
  }

  /**
   * Get enabled status (dynamic, reads from process.env each time)
   */
  get enabled() {
    return process.env.DEVIN_ENABLED === 'true';
  }

  /**
   * Check if Devin is properly configured
   */
  getStatus() {
    return {
      configured: this.enabled && !!this.apiKey,
      enabled: this.enabled,
      hasApiKey: !!this.apiKey,
      sessionsActive: this.sessions.size,
    };
  }

  /**
   * Create a new Devin session with a handoff prompt
   */
  async createSession(prompt, options = {}) {
    const status = this.getStatus();
    if (!status.configured) {
      throw new Error('Devin is not configured. Set DEVIN_ENABLED=true and DEVIN_API_KEY in backend/.env');
    }

    try {
      logger.info('Creating Devin session with handoff prompt', {
        keyPrefix: this.apiKey.substring(0, 4),
      });

      const payload = {
        prompt,
        title: options.title || 'EBDESIGN Handoff Session',
        tags: options.tags || ['ebdesign', 'claude-handoff'],
      };

      // Determine auth header based on key type
      const headers = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey.startsWith('apk_')) {
        // Personal API key
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      } else if (this.apiKey.startsWith('cog_') || this.apiKey.startsWith('svc_')) {
        // Service/Organization key - try multiple header formats
        headers['X-API-Key'] = this.apiKey;
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        headers['X-Devin-Key'] = this.apiKey;
      }

      const response = await axios.post(`${this.apiBaseUrl}/sessions`, payload, {
        headers,
        timeout: 30000,
      });

      const session = {
        sessionId: response.data.id || response.data.session_id,
        url: response.data.url,
        createdAt: new Date().toISOString(),
        status: 'created',
        prompt: prompt.substring(0, 200) + '...',
      };

      this.sessions.set(session.sessionId, session);
      logger.info('Devin session created', { sessionId: session.sessionId });

      return session;
    } catch (error) {
      logger.error('Failed to create Devin session', {
        error: error.message,
        response: error.response?.data,
      });

      // Provide helpful error messages
      if (error.response?.status === 401) {
        throw new Error('Devin API key is invalid. Check your DEVIN_API_KEY in backend/.env');
      }
      if (error.response?.status === 403) {
        throw new Error('Devin API key does not have permission to create sessions');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Devin API. Check internet connection or API endpoint');
      }

      throw error;
    }
  }

  /**
   * Get session details
   */
  async getSession(sessionId) {
    const status = this.getStatus();
    if (!status.configured) {
      throw new Error('Devin is not configured');
    }

    try {
      // Check local cache first
      if (this.sessions.has(sessionId)) {
        const cached = this.sessions.get(sessionId);
        cached.cached = true;
        return cached;
      }

      // Fetch from Devin API
      const response = await axios.get(`${this.apiBaseUrl}/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      });

      const session = {
        sessionId: response.data.id || sessionId,
        status: response.data.status,
        url: response.data.url,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
        progress: response.data.progress || {},
      };

      this.sessions.set(sessionId, session);
      return session;
    } catch (error) {
      logger.error('Failed to get Devin session', {
        sessionId,
        error: error.message,
      });

      if (error.response?.status === 404) {
        throw new Error(`Devin session ${sessionId} not found`);
      }

      throw error;
    }
  }

  /**
   * List active sessions
   */
  async listSessions() {
    const status = this.getStatus();
    if (!status.configured) {
      throw new Error('Devin is not configured');
    }

    try {
      const response = await axios.get(`${this.apiBaseUrl}/sessions`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      });

      return response.data.sessions || [];
    } catch (error) {
      logger.error('Failed to list Devin sessions', { error: error.message });
      throw error;
    }
  }

  /**
   * Send a message to a Devin session
   */
  async sendMessage(sessionId, message) {
    const status = this.getStatus();
    if (!status.configured) {
      throw new Error('Devin is not configured');
    }

    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/sessions/${sessionId}/messages`,
        { content: message },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to send message to Devin session', {
        sessionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Close a Devin session
   */
  async closeSession(sessionId) {
    const status = this.getStatus();
    if (!status.configured) {
      throw new Error('Devin is not configured');
    }

    try {
      await axios.post(
        `${this.apiBaseUrl}/sessions/${sessionId}/close`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      this.sessions.delete(sessionId);
      logger.info('Devin session closed', { sessionId });
    } catch (error) {
      logger.error('Failed to close Devin session', {
        sessionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Initialize the service
   */
  async initialize() {
    logger.info('DevinService initialized', {
      enabled: this.enabled,
      hasApiKey: !!this.apiKey,
    });
    return { status: 'initialized', configured: this.getStatus().configured };
  }

  /**
   * Execute a task through Devin
   */
  async executeTask(task) {
    const status = this.getStatus();
    if (!status.configured) {
      return { task, status: 'not_configured', error: 'Devin is not configured' };
    }

    try {
      // For now, just return a placeholder
      // Real implementation would interact with Devin's task execution API
      return { task, status: 'queued', message: 'Task queued for Devin execution' };
    } catch (error) {
      logger.error('Failed to execute task', { task, error: error.message });
      return { task, status: 'error', error: error.message };
    }
  }
}

module.exports = new DevinService();
