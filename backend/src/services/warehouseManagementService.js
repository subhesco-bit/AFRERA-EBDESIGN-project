const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class WarehouseManagementService {
  async createWarehouse(data) {
    try {
      const id = require('uuid').v4();
      await db('warehouses').insert({ id, name: data.name, location: data.location, capacity: data.capacity, created_at: new Date() });
      logger.info(`Warehouse created: ${id}`);
      return { warehouse_id: id, status: 'active' };
    } catch (error) { logger.error(`Create warehouse failed: ${error.message}`); throw error; }
  }

  async updateStock(warehouseId, productId, quantity) {
    try {
      await db('warehouse_stock').where({ warehouse_id: warehouseId, product_id: productId })
        .update({ quantity, updated_at: new Date() })
        .orInsert({ id: require('uuid').v4(), warehouse_id: warehouseId, product_id: productId, quantity, created_at: new Date() });
      logger.info(`Stock updated: ${warehouseId}`);
      return { warehouse_id: warehouseId, product_id: productId, quantity };
    } catch (error) { logger.error(`Update stock failed: ${error.message}`); throw error; }
  }

  async getWarehouseInventory(warehouseId) {
    try {
      const inventory = await db('warehouse_stock').where('warehouse_id', warehouseId);
      const total = inventory.reduce((sum, item) => sum + item.quantity, 0);
      return { warehouse_id: warehouseId, total_items: total, inventory };
    } catch (error) { logger.error(`Get inventory failed: ${error.message}`); throw error; }
  }
}

module.exports = new WarehouseManagementService();
