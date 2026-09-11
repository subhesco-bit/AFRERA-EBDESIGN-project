const villageService = require('./service');
const { logger } = require('../../utils/logger');
const { sendSuccess, sendError } = require('../../utils/response');

class M041Controller {
  async getVillages(req, res) {
    try {
      const result = await villageService.getVillages(req.query);
      return sendSuccess(res, result.data, result.pagination);
    } catch (error) {
      logger.error('M041 getVillages failed', error);
      return sendError(res, error, error.statusCode || 500);
    }
  }

  async getVillage(req, res) {
    try {
      return sendSuccess(res, await villageService.getVillageProfile(req.params.villageId));
    } catch (error) {
      logger.error('M041 getVillage failed', error);
      return sendError(res, error, error.statusCode || 404);
    }
  }

  async createVillage(req, res) {
    try {
      const result = await villageService.createVillage(req.body);
      return sendSuccess(res, result, null, 201);
    } catch (error) {
      logger.error('M041 createVillage failed', error);
      return sendError(res, error, error.statusCode || 400);
    }
  }

  async updateVillage(req, res) {
    try {
      return sendSuccess(res, await villageService.updateVillage(req.params.villageId, req.body));
    } catch (error) {
      logger.error('M041 updateVillage failed', error);
      return sendError(res, error, error.statusCode || 400);
    }
  }

  async deleteVillage(req, res) {
    try {
      return sendSuccess(res, await villageService.deleteVillage(req.params.villageId));
    } catch (error) {
      logger.error('M041 deleteVillage failed', error);
      return sendError(res, error, error.statusCode || 404);
    }
  }

  async addVillageResource(req, res) {
    try {
      const result = await villageService.addVillageResource(req.params.villageId, req.body);
      return sendSuccess(res, result, null, 201);
    } catch (error) {
      logger.error('M041 addVillageResource failed', error);
      return sendError(res, error, error.statusCode || 400);
    }
  }

  async getVillageAnalytics(req, res) {
    try {
      return sendSuccess(res, await villageService.getVillageAnalytics(req.params.villageId));
    } catch (error) {
      logger.error('M041 getVillageAnalytics failed', error);
      return sendError(res, error, error.statusCode || 404);
    }
  }
}

module.exports = new M041Controller();
