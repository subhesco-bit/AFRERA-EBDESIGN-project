const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class FreightPoolingService {
  async createFreightPool(data) {
    try {
      const id = require('uuid').v4();
      await db('freight_pools').insert({
        id, origin: data.origin, destination: data.destination,
        status: 'open', created_at: new Date()
      });
      logger.info(`Freight pool created: ${id}`);
      return { pool_id: id, status: 'open' };
    } catch (error) { logger.error(`Create pool failed: ${error.message}`); throw error; }
  }

  async joinFreightPool(poolId, shipmentId) {
    try {
      await db('freight_shipments').insert({
        id: require('uuid').v4(), freight_pool_id: poolId,
        shipment_id: shipmentId, created_at: new Date()
      });
      logger.info(`Shipment joined pool: ${poolId}`);
      return { pool_id: poolId, shipment_id: shipmentId, status: 'joined' };
    } catch (error) { logger.error(`Join pool failed: ${error.message}`); throw error; }
  }
}

module.exports = new FreightPoolingService();
