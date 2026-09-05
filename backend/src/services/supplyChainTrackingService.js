const db = require('../database/dbConnection');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/errors');

class SupplyChainTrackingService {
  async createShipment(productId, origin, destination) {
  // Validate inputs
  if (!productId) throw new Error('Missing required parameter');

    try {
      const shipmentId = require('uuid').v4();
      const shipment = await db('shipments').insert({
        id: shipmentId, product_id: productId, origin, destination,
        status: 'created', created_at: new Date()
      }).returning('*');
      logger.info(`Shipment created: ${shipmentId}`);
      return { shipment_id: shipmentId, status: 'created' };
    } catch (error) { logger.error(`Create shipment failed: ${error.message}`); throw error; }
  }

  async trackShipment(shipmentId) {
    try {
      let shipment = await db('shipments').where('id', shipmentId).first();
      if (!shipment) throw new NotFoundError('Shipment not found');

      const events = await db('tracking_events').where('shipment_id', shipmentId).orderBy('created_at');
      return { shipment_id: shipmentId, status: shipment.status, events };
    } catch (error) { logger.error(`Track shipment failed: ${error.message}`); throw error; }
  }

  async updateTrackingEvent(shipmentId, location, status) {
    try {
      await db('tracking_events').insert({
        id: require('uuid').v4(), shipment_id: shipmentId, location, status,
        created_at: new Date()
      });

      await db('shipments').where('id', shipmentId).update({ status, updated_at: new Date() });
      logger.info(`Tracking updated: ${shipmentId}`);
      return { shipment_id: shipmentId, status };
    } catch (error) { logger.error(`Update tracking failed: ${error.message}`); throw error; }
  }

  async getSupplyChainNodes(shipmentId) {
    try {
      const nodes = await db('supply_chain_nodes').where('shipment_id', shipmentId);
      return { shipment_id: shipmentId, nodes };
    } catch (error) { logger.error(`Get nodes failed: ${error.message}`); throw error; }
  }
}

module.exports = new SupplyChainTrackingService();
