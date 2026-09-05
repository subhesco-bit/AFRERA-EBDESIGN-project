const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class FarmAnalyticsService {
  async generateFarmReport(farmId) {
  // Validate inputs
  if (!farmId) throw new Error('Missing required parameter');

    try {
      const yields = await db('yields').where('farm_id', farmId);
      const costs = await db('farm_costs').where('farm_id', farmId).first();
      const soilTests = await db('soil_tests').where('farm_id', farmId);
      const avgYield = yields.length ? yields.reduce((sum, y) => sum + y.quantity, 0) / yields.length : 0;
      const roi = costs ? (avgYield * 1000 - costs.total_cost) / costs.total_cost * 100 : 0;
      const report = { farm_id: farmId, avg_yield: avgYield, roi, yield_count: yields.length, soil_test_count: soilTests.length };
      await db('farm_analytics_reports').insert({ id: require('uuid').v4(), farm_id: farmId, report_data: JSON.stringify(report), created_at: new Date() });
      logger.info(`Farm report generated: ${farmId}`);
      return report;
    } catch (error) { logger.error(`Generate report failed: ${error.message}`); throw error; }
  }

  async getDashboard(farmId) {
    try {
      const report = await db('farm_analytics_reports').where('farm_id', farmId).orderBy('created_at', 'desc').first();
      return { farm_id: farmId, dashboard: report ? JSON.parse(report.report_data) : {} };
    } catch (error) { logger.error(`Get dashboard failed: ${error.message}`); throw error; }
  }
}

module.exports = new FarmAnalyticsService();
