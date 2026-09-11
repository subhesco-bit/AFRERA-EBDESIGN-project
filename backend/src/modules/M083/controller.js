const m083Service = require('./service');
const { logger } = require('../../utils/logger');
const { sendSuccess, sendError } = require('../../utils/response');

class M083Controller {
  async getAll(req, res) {
    try {
      const { page, limit, status, user_id, search, sort, order } = req.query;

      const result = await m083Service.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        user_id,
        search,
        sort: sort || 'created_at',
        order: order || 'DESC',
      });

      return sendSuccess(res, result.data, result.pagination);
    } catch (error) {
      logger.error('Error in getAll:', error);
      return sendError(res, error);
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const result = await m083Service.getById(id);
      return sendSuccess(res, result);
    } catch (error) {
      logger.error('Error in getById:', error);
      return sendError(res, error, error.statusCode || 500);
    }
  }

  async create(req, res) {
    try {
      const { user_id, ...data } = req.body;

      if (!user_id) {
        return sendError(res, new Error('user_id is required'), 400);
      }

      const result = await m083Service.create({ user_id, ...data });
      return sendSuccess(res, result, null, 201);
    } catch (error) {
      logger.error('Error in create:', error);
      return sendError(res, error, error.statusCode || 400);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const result = await m083Service.update(id, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      logger.error('Error in update:', error);
      return sendError(res, error, error.statusCode || 400);
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await m083Service.delete(id);
      return sendSuccess(res, result);
    } catch (error) {
      logger.error('Error in delete:', error);
      return sendError(res, error, error.statusCode || 404);
    }
  }

  async createBulk(req, res) {
    try {
      const { records } = req.body;

      if (!Array.isArray(records)) {
        return sendError(res, new Error('records must be an array'), 400);
      }

      const result = await m083Service.createBulk(records);
      return sendSuccess(res, result, null, 201);
    } catch (error) {
      logger.error('Error in createBulk:', error);
      return sendError(res, error, 400);
    }
  }

  async search(req, res) {
    try {
      const { q, fields } = req.query;

      if (!q) {
        return sendError(res, new Error('Search query is required'), 400);
      }

      const result = await m083Service.search(q, fields ? fields.split(',') : undefined);
      return sendSuccess(res, result);
    } catch (error) {
      logger.error('Error in search:', error);
      return sendError(res, error);
    }
  }
}

module.exports = new M083Controller();