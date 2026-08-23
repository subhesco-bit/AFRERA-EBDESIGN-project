/**
 * AFRERA E-Commerce Business Sales Service
 * 
 * Comprehensive B2B marketplace and business sales features:
 * - Bulk Order Management (institutional procurement, B2B sales)
 * - Contract Farming Integration (long-term agreements, milestones)
 * - RFQ (Request for Quotation) Management
 * - Quotation Management (seller quotations, negotiation)
 * - B2B Pricing (volume discounts, tiered pricing)
 * - Sales Analytics (revenue tracking, conversion metrics)
 * - Commission Management (platform fees, seller commissions)
 * - Invoice Management (B2B invoicing, payment terms)
 * - Order Approval Workflows (multi-level approvals)
 * - Negotiation Support (counter-offers, revision tracking)
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const { signalBus } = require('../core/signalBus');

// ============================================================================
// B2B BULK ORDER MANAGEMENT
// ============================================================================

/**
 * Create B2B bulk order request
 */
async function createBulkOrder(buyerId, orderData) {
  const pg = getPostgreSQL();
  
  try {
    const {
      title,
      description,
      category_id,
      required_quantity,
      unit,
      target_price,
      delivery_location,
      required_by,
      specifications,
      business_type,
      payment_terms,
      delivery_terms
    } = orderData;
    
    // Generate bulk order ID
    const bulkOrderId = `BO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const bulkOrder = {
      id: bulkOrderId,
      buyer_id: buyerId,
      title,
      description,
      category_id,
      required_quantity,
      unit,
      target_price,
      delivery_location,
      required_by,
      specifications: JSON.stringify(specifications),
      business_type,
      payment_terms,
      delivery_terms,
      status: 'pending',
      quotation_count: 0,
      created_at: new Date().toISOString()
    };
    
    // Store bulk order
    await pg.query(`
      INSERT INTO bulk_orders 
      (id, buyer_id, title, description, category_id, required_quantity, unit, target_price, 
       delivery_location, required_by, specifications, business_type, payment_terms, delivery_terms, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
    `, [bulkOrderId, buyerId, title, description, category_id, required_quantity, unit, target_price,
        delivery_location, required_by, JSON.stringify(specifications), business_type, payment_terms, delivery_terms, 'pending']);
    
    // Find potential sellers
    const sellers = await findPotentialSellers(category_id, required_quantity, target_price);
    
    // Emit signal bus event
    await signalBus.emit('b2b.bulk_order.created', {
      bulk_order_id: bulkOrderId,
      buyer_id: buyerId,
      category_id,
      potential_sellers: sellers.length,
      timestamp: new Date().toISOString()
    });
    
    logger.info('B2B bulk order created', { bulkOrderId, buyerId });
    
    return {
      success: true,
      bulk_order: bulkOrder,
      potential_sellers: sellers
    };
  } catch (error) {
    logger.error('Error creating B2B bulk order', { error: error.message });
    throw error;
  }
}

/**
 * Find potential sellers for bulk order
 */
async function findPotentialSellers(categoryId, quantity, targetPrice) {
  const pg = getPostgreSQL();
  
  try {
    const sellers = await pg.query(`
      SELECT 
        pl.seller_id,
        u.full_name as seller_name,
        u.rating as seller_rating,
        COUNT(pl.id) as active_listings,
        SUM(pl.quantity) as total_available_quantity,
        AVG(pl.base_price) as avg_price
      FROM product_listings pl
      JOIN users u ON pl.seller_id = u.id
      WHERE pl.category_id = $1
        AND pl.listing_status = 'active'
        AND pl.quantity > 0
        AND pl.base_price <= $2
      GROUP BY pl.seller_id, u.full_name, u.rating
      HAVING SUM(pl.quantity) >= $3
      ORDER BY u.rating DESC, total_available_quantity DESC
      LIMIT 10
    `, [categoryId, targetPrice * 1.2, quantity]);
    
    return sellers.rows;
  } catch (error) {
    logger.error('Error finding potential sellers', { error: error.message });
    return [];
  }
}

/**
 * Submit quotation for bulk order
 */
async function submitQuotation(bulkOrderId, sellerId, quotationData) {
  const pg = getPostgreSQL();
  
  try {
    const {
      quoted_price,
      available_quantity,
      unit,
      delivery_date,
      delivery_cost,
      notes,
      quotation_validity_days
    } = quotationData;
    
    // Generate quotation ID
    const quotationId = `QT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const quotation = {
      id: quotationId,
      bulk_order_id: bulkOrderId,
      seller_id: sellerId,
      quoted_price,
      available_quantity,
      unit,
      delivery_date,
      delivery_cost,
      notes,
      status: 'pending',
      expires_at: new Date(Date.now() + (quotation_validity_days || 30) * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };
    
    // Store quotation
    await pg.query(`
      INSERT INTO quotations 
      (id, bulk_order_id, seller_id, quoted_price, available_quantity, unit, delivery_date, delivery_cost, notes, status, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    `, [quotationId, bulkOrderId, sellerId, quoted_price, available_quantity, unit, delivery_date, 
        delivery_cost, notes, 'pending', quotation.expires_at]);
    
    // Update bulk order quotation count
    await pg.query(`
      UPDATE bulk_orders 
      SET quotation_count = quotation_count + 1, updated_at = NOW()
      WHERE id = $1
    `, [bulkOrderId]);
    
    // Emit signal bus event
    await signalBus.emit('b2b.quotation.submitted', {
      quotation_id: quotationId,
      bulk_order_id: bulkOrderId,
      seller_id: sellerId,
      quoted_price,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Quotation submitted', { quotationId, bulkOrderId, sellerId });
    
    return {
      success: true,
      quotation
    };
  } catch (error) {
    logger.error('Error submitting quotation', { error: error.message });
    throw error;
  }
}

/**
 * Accept quotation and create order
 */
async function acceptQuotation(quotationId, buyerId) {
  const pg = getPostgreSQL();
  
  try {
    // Get quotation details
    const quotation = await pg.query(`
      SELECT q.*, bo.*, u.full_name as seller_name
      FROM quotations q
      JOIN bulk_orders bo ON q.bulk_order_id = bo.id
      JOIN users u ON q.seller_id = u.id
      WHERE q.id = $1
    `, [quotationId]);
    
    if (quotation.rows.length === 0) {
      throw new Error('Quotation not found');
    }
    
    const qtData = quotation.rows[0];
    
    // Update quotation status
    await pg.query(`
      UPDATE quotations 
      SET status = 'accepted', updated_at = NOW()
      WHERE id = $1
    `, [quotationId]);
    
    // Create actual order from quotation
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const order = {
      id: orderId,
      user_id: buyerId,
      seller_id: qtData.seller_id,
      order_type: 'B2B',
      bulk_order_id: qtData.bulk_order_id,
      quotation_id: quotationId,
      total_amount: qtData.quoted_price * qtData.available_quantity,
      quantity: qtData.available_quantity,
      unit: qtData.unit,
      delivery_date: qtData.delivery_date,
      delivery_cost: qtData.delivery_cost,
      status: 'confirmed',
      created_at: new Date().toISOString()
    };
    
    // Store order
    await pg.query(`
      INSERT INTO orders 
      (id, user_id, seller_id, order_type, bulk_order_id, quotation_id, total_amount, quantity, unit, delivery_date, delivery_cost, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    `, [orderId, buyerId, qtData.seller_id, 'B2B', qtData.bulk_order_id, quotationId, order.total_amount, 
        order.quantity, order.unit, order.delivery_date, order.delivery_cost, 'confirmed']);
    
    // Update bulk order status
    await pg.query(`
      UPDATE bulk_orders 
      SET status = 'accepted', updated_at = NOW()
      WHERE id = $1
    `, [qtData.bulk_order_id]);
    
    // Emit signal bus event
    await signalBus.emit('b2b.order.created', {
      order_id: orderId,
      quotation_id: quotationId,
      bulk_order_id: qtData.bulk_order_id,
      buyer_id: buyerId,
      seller_id: qtData.seller_id,
      total_amount: order.total_amount,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Quotation accepted and order created', { orderId, quotationId });
    
    return {
      success: true,
      order
    };
  } catch (error) {
    logger.error('Error accepting quotation', { error: error.message });
    throw error;
  }
}

// ============================================================================
// CONTRACT FARMING INTEGRATION
// ============================================================================

/**
 * Create contract farming agreement
 */
async function createContractFarming(buyerId, contractData) {
  const pg = getPostgreSQL();
  
  try {
    const {
      farmer_id,
      crop_type,
      variety,
      contract_quantity,
      unit,
      agreed_price,
      contract_start_date,
      contract_end_date,
      quality_standards,
      delivery_schedule,
      payment_terms,
      milestone_payments
    } = contractData;
    
    // Generate contract ID
    const contractId = `CF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const contract = {
      id: contractId,
      buyer_id: buyerId,
      farmer_id,
      crop_type,
      variety,
      contract_quantity,
      unit,
      agreed_price,
      contract_start_date,
      contract_end_date,
      quality_standards: JSON.stringify(quality_standards),
      delivery_schedule: JSON.stringify(delivery_schedule),
      payment_terms,
      milestone_payments: JSON.stringify(milestone_payments),
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    // Store contract
    await pg.query(`
      INSERT INTO contract_farming 
      (id, buyer_id, farmer_id, crop_type, variety, contract_quantity, unit, agreed_price, 
       contract_start_date, contract_end_date, quality_standards, delivery_schedule, payment_terms, milestone_payments, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
    `, [contractId, buyerId, farmer_id, crop_type, variety, contract_quantity, unit, agreed_price,
        contract_start_date, contract_end_date, JSON.stringify(quality_standards), JSON.stringify(delivery_schedule),
        payment_terms, JSON.stringify(milestone_payments), 'active']);

    // Emit signal bus event
    await signalBus.emit('b2b.contract_farming.created', {
      contract_id: contractId,
      buyer_id: buyerId,
      farmer_id,
      contract_value: contract_quantity * agreed_price,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Contract farming agreement created', { contractId });
    
    return {
      success: true,
      contract
    };
  } catch (error) {
    logger.error('Error creating contract farming agreement', { error: error.message });
    throw error;
  }
}

/**
 * Record contract milestone
 */
async function recordContractMilestone(contractId, milestoneData) {
  const pg = getPostgreSQL();
  
  try {
    const {
      milestone_name,
      milestone_date,
      quantity_delivered,
      quality_verified,
      payment_amount,
      payment_status
    } = milestoneData;
    
    // Generate milestone ID
    const milestoneId = `MS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const milestone = {
      id: milestoneId,
      contract_id: contractId,
      milestone_name,
      milestone_date,
      quantity_delivered,
      quality_verified,
      payment_amount,
      payment_status,
      created_at: new Date().toISOString()
    };
    
    // Store milestone
    await pg.query(`
      INSERT INTO contract_milestones 
      (id, contract_id, milestone_name, milestone_date, quantity_delivered, quality_verified, payment_amount, payment_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [milestoneId, contractId, milestone_name, milestone_date, quantity_delivered, quality_verified, 
        payment_amount, payment_status]);
    
    // Update contract status if all milestones complete
    await pg.query(`
      UPDATE contract_farming 
      SET status = 'completed', updated_at = NOW()
      WHERE id = $1 AND (SELECT COUNT(*) FROM contract_milestones WHERE contract_id = $1) = 
        (SELECT milestone_payments::jsonb->>'length' FROM contract_farming WHERE id = $1)
    `, [contractId]);
    
    logger.info('Contract milestone recorded', { milestoneId, contractId });
    
    return {
      success: true,
      milestone
    };
  } catch (error) {
    logger.error('Error recording contract milestone', { error: error.message });
    throw error;
  }
}

// ============================================================================
// SALES ANALYTICS
// ============================================================================

/**
 * Get comprehensive sales analytics
 */
async function getSalesAnalytics(filters = {}) {
  const pg = getPostgreSQL();
  
  try {
    const {
      start_date,
      end_date,
      category_id,
      seller_id,
      business_type
    } = filters;
    
    // Build base query
    let query = `
      SELECT 
        DATE_TRUNC('day', o.created_at) as date,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.user_id) as unique_customers,
        SUM(oi.quantity * oi.unit_price) as total_revenue,
        AVG(oi.quantity * oi.unit_price) as avg_order_value,
        SUM(oi.quantity) as total_quantity_sold
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN product_listings pl ON oi.product_id = pl.id
      WHERE o.status = 'completed'
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (start_date) {
      paramCount++;
      query += ` AND o.created_at >= $${paramCount}`;
      params.push(start_date);
    }
    
    if (end_date) {
      paramCount++;
      query += ` AND o.created_at <= $${paramCount}`;
      params.push(end_date);
    }
    
    if (category_id) {
      paramCount++;
      query += ` AND pl.category_id = $${paramCount}`;
      params.push(category_id);
    }
    
    if (seller_id) {
      paramCount++;
      query += ` AND o.seller_id = $${paramCount}`;
      params.push(seller_id);
    }
    
    if (business_type) {
      paramCount++;
      query += ` AND o.order_type = $${paramCount}`;
      params.push(business_type);
    }
    
    query += ` GROUP BY DATE_TRUNC('day', o.created_at)
               ORDER BY date ASC`;
    
    const result = await pg.query(query, params);
    
    // Calculate summary statistics
    const summary = result.rows.reduce((acc, row) => {
      acc.total_orders += parseInt(row.total_orders);
      acc.total_revenue += parseFloat(row.total_revenue);
      acc.unique_customers += parseInt(row.unique_customers);
      acc.total_quantity += parseFloat(row.total_quantity_sold);
      return acc;
    }, { total_orders: 0, total_revenue: 0, unique_customers: 0, total_quantity: 0 });
    
    logger.info('Sales analytics generated', { summary });
    
    return {
      success: true,
      filters,
      summary,
      daily_data: result.rows
    };
  } catch (error) {
    logger.error('Error generating sales analytics', { error: error.message });
    throw error;
  }
}

/**
 * Get B2B conversion metrics
 */
async function getB2BConversionMetrics(periodDays = 30) {
  const pg = getPostgreSQL();
  
  try {
    const metrics = await pg.query(`
      WITH funnel AS (
        SELECT 
          COUNT(DISTINCT id) as bulk_orders_created,
          COUNT(DISTINCT CASE WHEN quotation_count > 0 THEN id END) as received_quotations,
          COUNT(DISTINCT CASE WHEN status = 'accepted' THEN id END) as accepted_orders,
          COUNT(DISTINCT CASE WHEN status = 'completed' THEN id END) as completed_orders
        FROM bulk_orders
        WHERE created_at > NOW() - INTERVAL '${periodDays} days'
      )
      SELECT 
        bulk_orders_created,
        received_quotations,
        accepted_orders,
        completed_orders,
        CASE WHEN bulk_orders_created > 0 
          THEN ROUND((received_quotations::FLOAT / bulk_orders_created) * 100, 2) 
          ELSE 0 END as quotation_response_rate,
        CASE WHEN received_quotations > 0 
          THEN ROUND((accepted_orders::FLOAT / received_quotations) * 100, 2) 
          ELSE 0 END as acceptance_rate,
        CASE WHEN accepted_orders > 0 
          THEN ROUND((completed_orders::FLOAT / accepted_orders) * 100, 2) 
          ELSE 0 END as completion_rate
      FROM funnel
    `);
    
    return {
      success: true,
      period_days: periodDays,
      metrics: metrics.rows[0]
    };
  } catch (error) {
    logger.error('Error getting B2B conversion metrics', { error: error.message });
    throw error;
  }
}

// ============================================================================
// COMMISSION MANAGEMENT
// ============================================================================

/**
 * Calculate platform commission for order
 */
async function calculateCommission(orderId) {
  const pg = getPostgreSQL();
  
  try {
    // Get order details
    const order = await pg.query(`
      SELECT 
        o.*,
        o.total_amount,
        u.tier as seller_tier
      FROM orders o
      JOIN users u ON o.seller_id = u.id
      WHERE o.id = $1
    `, [orderId]);
    
    if (order.rows.length === 0) {
      throw new Error('Order not found');
    }
    
    const orderData = order.rows[0];
    const totalAmount = parseFloat(orderData.total_amount);
    
    // Calculate commission based on seller tier
    const commissionRates = {
      'platinum': 0.05,  // 5%
      'gold': 0.07,      // 7%
      'silver': 0.10,    // 10%
      'bronze': 0.12     // 12%
    };
    
    const commissionRate = commissionRates[orderData.seller_tier] || 0.10;
    const commissionAmount = totalAmount * commissionRate;
    const sellerPayout = totalAmount - commissionAmount;
    
    const commission = {
      order_id: orderId,
      total_amount: totalAmount,
      commission_rate: commissionRate,
      commission_amount: Math.round(commissionAmount * 100) / 100,
      seller_payout: Math.round(sellerPayout * 100) / 100,
      seller_tier: orderData.seller_tier,
      calculated_at: new Date().toISOString()
    };
    
    // Store commission
    await pg.query(`
      INSERT INTO platform_commissions 
      (order_id, total_amount, commission_rate, commission_amount, seller_payout, seller_tier, calculated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (order_id) 
      DO UPDATE SET commission_amount = $4, seller_payout = $5, updated_at = NOW()
    `, [orderId, totalAmount, commissionRate, commissionAmount, sellerPayout, orderData.seller_tier]);
    
    logger.info('Commission calculated', { orderId, commission_amount: commissionAmount });
    
    return {
      success: true,
      commission
    };
  } catch (error) {
    logger.error('Error calculating commission', { error: error.message, orderId });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // B2B Bulk Orders
  createBulkOrder,
  findPotentialSellers,
  submitQuotation,
  acceptQuotation,
  
  // Contract Farming
  createContractFarming,
  recordContractMilestone,
  
  // Sales Analytics
  getSalesAnalytics,
  getB2BConversionMetrics,
  
  // Commission Management
  calculateCommission
};
