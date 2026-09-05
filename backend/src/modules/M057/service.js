/**
 * Shipping Management Service (M057)
 * Shipping and delivery management with AI-powered route optimization
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

async function createShipment(shipmentData) {
  try {
    const { order_id, shipping_address, delivery_method, items } = shipmentData;
    const shipment = {
      shipment_id: generateId(),
      order_id,
      shipping_address,
      delivery_method,
      items,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const aiRequest = {
      task: 'route_optimization',
      parameters: { shipment_data: shipmentData, traffic_data: await getTrafficData(), weather_data: await getWeatherData() }
    };
    shipment.ai_recommendations = await aiAPI.generateRecommendation(aiRequest);

    const result = await pool.query(
      `INSERT INTO shipments (shipment_id, order_id, shipping_address, delivery_method, items, status, ai_recommendations, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [shipment.shipment_id, shipment.order_id, JSON.stringify(shipment.shipping_address), shipment.delivery_method, JSON.stringify(shipment.items), shipment.status, JSON.stringify(shipment.ai_recommendations), shipment.created_at]
    );

    logger.info(`Shipment created: ${shipment.shipment_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating shipment', { error: error.message });
    throw new Error('Failed to create shipment');
  }
}

async function trackShipment(shipmentId) {
  try {
    const res = await pool.query('SELECT * FROM shipments WHERE shipment_id = $1', [shipmentId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error tracking shipment', { error: error.message });
    throw new Error('Failed to track shipment');
  }
}

async function updateShipmentStatus(shipmentId, status, location = null) {
  try {
    let res = await pool.query(
      'UPDATE shipments SET status = $1, current_location = $2, updated_at = NOW() WHERE shipment_id = $3 RETURNING *',
      [status, location, shipmentId]
    );
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error updating shipment status', { error: error.message });
    throw new Error('Failed to update shipment status');
  }
}

function generateId() {
  return `SHP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getTrafficData() {
  return { congestion_level: 'low', average_speed: 50 };
}

async function getWeatherData() {
  return { condition: 'clear', temperature: 25 };
}

module.exports = { createShipment, trackShipment, updateShipmentStatus };
