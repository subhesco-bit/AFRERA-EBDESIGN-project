/**
 * GST Service - Goods and Services Tax Calculation
 * Handles GST calculation for AFRERA platform orders
 */

const { logger } = require('../utils/logger');

class GSTService {
  constructor() {
    // Shared pool (2026-08-04): was a per-instance Pool. 42 services each
    // holding one meant ~420 connections vs a PostgreSQL default of 100.
    this.pool = require('../database/pool');
  }

  /**
   * GST Rates based on product categories
   */
  getGSTRate(productCategory) {
    const gstRates = {
      'fruits': 0,           // 0% - Fresh fruits
      'vegetables': 0,       // 0% - Fresh vegetables
      'cereals': 0,          // 0% - Cereals
      'pulses': 0,           // 0% - Pulses
      'milk': 0,             // 0% - Milk
      'flour': 0,            // 0% - Flour
      'processed_food': 5,   // 5% - Processed food
      'spices': 5,           // 5% - Spices
      'honey': 5,            // 5% - Honey
      'tea': 5,              // 5% - Tea
      'coffee': 5,           // 5% - Coffee
      'dairy_products': 12, // 12% - Dairy products
      'oil': 12,             // 12% - Edible oil
      'sugar': 12,           // 12% - Sugar
      'value_added': 18,    // 18% - Value added products
      'packaged_food': 18,   // 18% - Packaged food
      'beverages': 18,      // 18% - Beverages
      'snacks': 18,          // 18% - Snacks
      'services': 18        // 18% - Services
    };

    return gstRates[productCategory] || 18; // Default 18%
  }

  /**
   * Calculate GST for an order
   */
  async calculateOrderGST(orderId) {
    try {
      const query = `
        SELECT 
          oi.product_id,
          oi.quantity,
          oi.unit_price,
          p.category,
          p.gst_applicable
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `;

      const result = await this.pool.query(query, [orderId]);
      const items = result.rows;

      let totalGST = 0;
      const gstBreakdown = [];

      for (const item of items) {
        if (!item.gst_applicable) {
          continue;
        }

        const gstRate = this.getGSTRate(item.category);
        const itemValue = item.quantity * item.unit_price;
        const gstAmount = (itemValue * gstRate) / 100;

        totalGST += gstAmount;

        gstBreakdown.push({
          productId: item.product_id,
          category: item.category,
          gstRate: gstRate,
          itemValue: itemValue,
          gstAmount: gstAmount
        });
      }

      return {
        orderId,
        totalGST: totalGST.toFixed(2),
        gstBreakdown,
        calculatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error calculating order GST', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Calculate GST for a single product
   */
  calculateProductGST(product) {
    const gstRate = this.getGSTRate(product.category);
    const gstAmount = (product.price * gstRate) / 100;

    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      basePrice: product.price,
      gstRate: gstRate,
      gstAmount: gstAmount.toFixed(2),
      totalPrice: (product.price + gstAmount).toFixed(2)
    };
  }

  /**
   * Get GST summary for a period
   */
  async getGSTSummary(startDate, endDate) {
    try {
      const query = `
        SELECT 
          DATE_TRUNC('month', o.created_at) as month,
          COUNT(DISTINCT o.id) as total_orders,
          SUM(o.total_amount) as total_sales,
          SUM(o.gst_amount) as total_gst_collected,
          p.category,
          COUNT(oi.id) as item_count,
          SUM(oi.quantity * oi.unit_price) as category_sales
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE o.created_at >= $1 AND o.created_at <= $2
          AND o.status = 'completed'
        GROUP BY month, p.category
        ORDER BY month DESC, category_sales DESC
      `;

      const result = await this.pool.query(query, [startDate, endDate]);

      return {
        period: { startDate, endDate },
        summary: result.rows
      };
    } catch (error) {
      logger.error('Error getting GST summary', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Generate GST invoice for an order
   */
  async generateGSTInvoice(orderId) {
    try {
      const gstCalculation = await this.calculateOrderGST(orderId);

      const query = `
        SELECT 
          o.*,
          u.name as customer_name,
          u.gst_number as customer_gst,
          u.address as customer_address
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = $1
      `;

      const orderResult = await this.pool.query(query, [orderId]);
      const order = orderResult.rows[0];

      return {
        invoiceNumber: `INV-${orderId}-${Date.now()}`,
        orderDetails: order,
        gstCalculation,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error generating GST invoice', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Validate GST number format
   */
  validateGSTNumber(gstNumber) {
    // GSTIN format: 22AAAAA0000A1Z5 (15 characters)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  }

  /**
   * Update order with GST details
   */
  async updateOrderGST(orderId, gstDetails) {
    try {
      const query = `
        UPDATE orders
        SET 
          gst_amount = $1,
          gst_breakdown = $2,
          gst_invoice_number = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        gstDetails.totalGST,
        JSON.stringify(gstDetails.gstBreakdown),
        gstDetails.invoiceNumber,
        orderId
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating order GST', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new GSTService();
