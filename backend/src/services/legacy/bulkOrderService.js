/**
 * Bulk Order Service
 * Handles bulk/wholesale orders for AFRERA marketplace
 */

const { logger } = require('../../utils/logger');

class BulkOrderService {
  constructor() {
    // Shared pool (2026-08-04): was a per-instance Pool. 42 services each
    // holding one meant ~420 connections vs a PostgreSQL default of 100.
    this.pool = require('../../database/pool');
  }

  /**
   * Create bulk order request
   */
  async createBulkOrderRequest(userId, requestData) {
    const {
      productId,
      quantity,
      expectedDeliveryDate,
      deliveryLocation,
      specialRequirements,
      budgetPerUnit,
      contactPerson,
      contactPhone,
      contactEmail
    } = requestData;

    try {
      // Get product details
      const productQuery = `
        SELECT * FROM products WHERE id = $1
      `;
      const productResult = await this.pool.query(productQuery, [productId]);
      const product = productResult.rows[0];

      if (!product) {
        throw new Error('Product not found');
      }

      // Calculate estimated total
      const estimatedTotal = quantity * (budgetPerUnit || product.price);

      const query = `
        INSERT INTO bulk_orders 
        (user_id, product_id, quantity, expected_delivery_date, delivery_location,
         special_requirements, budget_per_unit, estimated_total, contact_person,
         contact_phone, contact_email, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        userId,
        productId,
        quantity,
        expectedDeliveryDate,
        deliveryLocation,
        specialRequirements,
        budgetPerUnit,
        estimatedTotal,
        contactPerson,
        contactPhone,
        contactEmail
      ]);

      logger.info(`Bulk order request created: ${result.rows[0].id}`);
      return {
        ...result.rows[0],
        productDetails: product
      };
    } catch (error) {
      logger.error('Error creating bulk order request', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get bulk order request by ID
   */
  async getBulkOrder(orderId, userId, isAdmin = false) {
    try {
      let query = `
        SELECT 
          bo.*,
          p.name as product_name,
          p.image as product_image,
          p.gi_tag,
          p.category,
          u.name as user_name,
          u.company_name as user_company
        FROM bulk_orders bo
        JOIN products p ON bo.product_id = p.id
        JOIN users u ON bo.user_id = u.id
        WHERE bo.id = $1
      `;

      const params = [orderId];

      if (!isAdmin) {
        query += ' AND bo.user_id = $2';
        params.push(userId);
      }

      const result = await this.pool.query(query, params);

      if (result.rows.length === 0) {
        throw new Error('Bulk order not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting bulk order', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get user's bulk orders
   */
  async getUserBulkOrders(userId, filters = {}) {
    const { status, page = 1, limit = 20 } = filters;

    try {
      let query = `
        SELECT 
          bo.*,
          p.name as product_name,
          p.image as product_image
        FROM bulk_orders bo
        JOIN products p ON bo.product_id = p.id
        WHERE bo.user_id = $1
      `;

      const params = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND bo.status = $${paramCount}`;
        params.push(status);
      }

      query += ' ORDER BY bo.created_at DESC';

      const offset = (page - 1) * limit;
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await this.pool.query(query, params);

      return {
        orders: result.rows,
        pagination: { page, limit }
      };
    } catch (error) {
      logger.error('Error getting user bulk orders', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get all bulk orders (admin)
   */
  async getAllBulkOrders(filters = {}) {
    const { status, productId, page = 1, limit = 20 } = filters;

    try {
      let query = `
        SELECT 
          bo.*,
          p.name as product_name,
          p.image as product_image,
          u.name as user_name,
          u.company_name as user_company
        FROM bulk_orders bo
        JOIN products p ON bo.product_id = p.id
        JOIN users u ON bo.user_id = u.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND bo.status = $${paramCount}`;
        params.push(status);
      }

      if (productId) {
        paramCount++;
        query += ` AND bo.product_id = $${paramCount}`;
        params.push(productId);
      }

      query += ' ORDER BY bo.created_at DESC';

      const offset = (page - 1) * limit;
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await this.pool.query(query, params);

      return {
        orders: result.rows,
        pagination: { page, limit }
      };
    } catch (error) {
      logger.error('Error getting all bulk orders', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Update bulk order status
   */
  async updateBulkOrderStatus(orderId, status, adminId, notes = null) {
    try {
      const query = `
        UPDATE bulk_orders
        SET 
          status = $1,
          reviewed_by = $2,
          review_notes = $3,
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const result = await this.pool.query(query, [status, adminId, notes, orderId]);

      if (result.rows.length === 0) {
        throw new Error('Bulk order not found');
      }

      logger.info(`Bulk order ${orderId} status updated to ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating bulk order status', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Create quotation for bulk order
   */
  // Was missing entirely - bulkOrderController.js's getBulkOrderQuotations
  // handler was a hardcoded stub ("service method to be implemented")
  // because this never existed. Real table/columns confirmed from
  // createQuotation() just below.
  async getQuotationsForOrder(orderId) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM bulk_order_quotations WHERE bulk_order_id = $1 ORDER BY created_at DESC`,
        [orderId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting quotations for bulk order', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async createQuotation(orderId, quotationData) {
    const {
      pricePerUnit,
      totalPrice,
      validUntil,
      terms,
      conditions,
      deliveryTimeline,
      paymentTerms
    } = quotationData;

    try {
      const query = `
        INSERT INTO bulk_order_quotations 
        (bulk_order_id, price_per_unit, total_price, valid_until, terms,
         conditions, delivery_timeline, payment_terms, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sent')
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        orderId,
        pricePerUnit,
        totalPrice,
        validUntil,
        terms,
        conditions,
        deliveryTimeline,
        paymentTerms
      ]);

      // Update bulk order status
      await this.updateBulkOrderStatus(orderId, 'quoted', null);

      logger.info(`Quotation created for bulk order ${orderId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating quotation', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Accept quotation
   */
  async acceptQuotation(quotationId, userId) {
    try {
      const query = `
        UPDATE bulk_order_quotations
        SET 
          status = 'accepted',
          accepted_at = NOW(),
          accepted_by = $1
        WHERE id = $2
        RETURNING *
      `;

      const result = await this.pool.query(query, [userId, quotationId]);

      if (result.rows.length === 0) {
        throw new Error('Quotation not found');
      }

      // Convert to actual order
      const quotation = result.rows[0];
      await this.convertQuotationToOrder(quotation);

      logger.info(`Quotation ${quotationId} accepted by user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error accepting quotation', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Convert quotation to actual order
   */
  async convertQuotationToOrder(quotation) {
    try {
      // Get bulk order details
      const bulkOrderQuery = `
        SELECT * FROM bulk_orders WHERE id = $1
      `;
      const bulkOrderResult = await this.pool.query(bulkOrderQuery, [quotation.bulk_order_id]);
      const bulkOrder = bulkOrderResult.rows[0];

      // Create order
      const orderQuery = `
        INSERT INTO orders 
        (user_id, total_amount, gst_amount, status, order_type, delivery_location,
         contact_person, contact_phone, contact_email, special_requirements)
        VALUES ($1, $2, 0, 'confirmed', 'bulk', $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const orderResult = await this.pool.query(orderQuery, [
        bulkOrder.user_id,
        quotation.total_price,
        bulkOrder.delivery_location,
        bulkOrder.contact_person,
        bulkOrder.contact_phone,
        bulkOrder.contact_email,
        bulkOrder.special_requirements
      ]);

      const order = orderResult.rows[0];

      // Add order item
      const itemQuery = `
        INSERT INTO order_items 
        (order_id, product_id, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      await this.pool.query(itemQuery, [
        order.id,
        bulkOrder.product_id,
        bulkOrder.quantity,
        quotation.price_per_unit,
        quotation.total_price
      ]);

      // Update bulk order status
      await this.updateBulkOrderStatus(bulkOrder.id, 'confirmed', null);

      logger.info(`Bulk order ${bulkOrder.id} converted to order ${order.id}`);
      return order;
    } catch (error) {
      logger.error('Error converting quotation to order', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Reject quotation
   */
  async rejectQuotation(quotationId, userId, reason) {
    try {
      const query = `
        UPDATE bulk_order_quotations
        SET 
          status = 'rejected',
          rejected_at = NOW(),
          rejected_by = $1,
          rejection_reason = $2
        WHERE id = $2
        RETURNING *
      `;

      const result = await this.pool.query(query, [userId, reason, quotationId]);

      if (result.rows.length === 0) {
        throw new Error('Quotation not found');
      }

      // Update bulk order status back to pending
      const quotation = result.rows[0];
      await this.updateBulkOrderStatus(quotation.bulk_order_id, 'pending', null);

      logger.info(`Quotation ${quotationId} rejected by user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error rejecting quotation', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get bulk order statistics
   */
  async getBulkOrderStats(filters = {}) {
    const { startDate, endDate, productId } = filters;

    try {
      let query = `
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'quoted' THEN 1 END) as quoted,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
          SUM(estimated_total) as total_estimated_value,
          AVG(estimated_total) as average_order_value
        FROM bulk_orders
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      if (startDate) {
        paramCount++;
        query += ` AND created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND created_at <= $${paramCount}`;
        params.push(endDate);
      }

      if (productId) {
        paramCount++;
        query += ` AND product_id = $${paramCount}`;
        params.push(productId);
      }

      const result = await this.pool.query(query, params);

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting bulk order stats', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Cancel bulk order request
   */
  async cancelBulkOrder(orderId, userId) {
    try {
      const query = `
        UPDATE bulk_orders
        SET 
          status = 'cancelled',
          cancelled_at = NOW(),
          cancelled_by = $1
        WHERE id = $2 AND user_id = $1 AND status IN ('pending', 'quoted')
        RETURNING *
      `;

      const result = await this.pool.query(query, [userId, orderId]);

      if (result.rows.length === 0) {
        throw new Error('Bulk order not found or cannot be cancelled');
      }

      logger.info(`Bulk order ${orderId} cancelled by user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error cancelling bulk order', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new BulkOrderService();

// Merged from backend/src/modules/M053
{
  const m053 = require("../../modules/M053/service");
  const { ...rest } = m053;
  Object.assign(module.exports, rest);
}
