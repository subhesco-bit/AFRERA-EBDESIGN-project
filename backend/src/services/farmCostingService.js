const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class FarmCostingService {
  async calculateFarmCost(farmId, crops) {
  // Validate inputs
  if (!farmId) throw new Error('Missing required parameter');

    try {
      let totalCost = 0;
      for (const crop of crops) {
        const seedCost = crop.area * crop.seed_rate * crop.seed_price;
        const laborCost = crop.area * crop.labor_rate * crop.labor_days;
        const cost = seedCost + laborCost + (crop.fertilizer_cost || 0) + (crop.pesticide_cost || 0);
        totalCost += cost;
      }
      await db('farm_costs').insert({
        id: require('uuid').v4(), farm_id: farmId, total_cost: totalCost, created_at: new Date()
      });
      logger.info(`Farm cost calculated: ${farmId}`);
      return { farm_id: farmId, total_cost: totalCost };
    } catch (error) { logger.error(`Calculate cost failed: ${error.message}`); throw error; }
  }
}

module.exports = new FarmCostingService();
