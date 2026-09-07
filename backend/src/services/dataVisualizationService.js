const db = require('../database/dbConnection');
const logger = require('../utils/logger');
class DataVisualizationService {
  async generateChart(dataId, chartType) {
    try { const id = require('uuid').v4(); await db('charts').insert({ id, data_id: dataId, chart_type: chartType, created_at: new Date() }); return { chart_id: id, chart_type: chartType, status: 'ready' }; }
    catch (error) { logger.error('Generate chart failed'); throw error; }
  }
}
module.exports = new DataVisualizationService();
