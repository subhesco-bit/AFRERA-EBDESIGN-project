const m262Service = require('./service');
const { logger } = require('../../utils/logger');

class M262Controller {
  async getAll(req, res) {
    try {
      const result = await m262Service.getAll(req.query);
      return res.json({ success: true, ...result });
    } catch (error) {
      logger.error('Error:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const result = await m262Service.getById(req.params.id);
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(404).json({ success: false, error: error.message });
    }
  }

  async create(req, res) {
    try {
      const result = await m262Service.create(req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async update(req, res) {
    try {
      const result = await m262Service.update(req.params.id, req.body);
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await m262Service.delete(req.params.id);
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(404).json({ success: false, error: error.message });
    }
  }
}

module.exports = new M262Controller();