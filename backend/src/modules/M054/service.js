/**
 * Customer Management Service (M054)
 * Customer profile management with AI-powered insights and personalization
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Create customer with AI-powered segmentation
 */
async function createCustomer(customerData) {
  try {
    const {
      name,
      email,
      phone,
      address,
      customer_type,
      business_type,
      metadata
    } = customerData;

    const customer = {
      customer_id: generateId(),
      name,
      email,
      phone,
      address,
      customer_type,
      business_type,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered customer segmentation
    const aiRequest = {
      task: 'customer_segmentation',
      parameters: {
        customer_data: customerData,
        demographics: await getDemographics(address),
        market_potential: await assessMarketPotential(customer_type, business_type),
        personalization_opportunities: await getPersonalizationOpportunities(customerData)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    customer.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO customers 
       (customer_id, name, email, phone, address, customer_type, 
        business_type, status, ai_recommendations, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        customer.customer_id,
        customer.name,
        customer.email,
        customer.phone,
        JSON.stringify(customer.address),
        customer.customer_type,
        customer.business_type,
        customer.status,
        JSON.stringify(customer.ai_recommendations),
        JSON.stringify(metadata || {}),
        customer.created_at
      ]
    );

    logger.info(`Customer created: ${customer.customer_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating customer', { error: error.message, stack: error.stack });
    throw new Error('Failed to create customer');
  }
}

/**
 * List customers with filtering
 */
async function listCustomers({ page = 1, limit = 20, status = null, customerType = null } = {}) {
  try {
    const offset = (page - 1) * limit;
    
    let countQuery = 'SELECT COUNT(*) FROM customers';
    let countParams = [];
    let conditions = [];
    
    if (status) {
      conditions.push('status = $' + (conditions.length + 1));
      countParams.push(status);
    }
    if (customerType) {
      conditions.push('customer_type = $' + (conditions.length + 1));
      countParams.push(customerType);
    }
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const totalRes = await pool.query(countQuery, countParams);
    const total = parseInt(totalRes.rows[0].count || '0');
    
    let dataQuery = 'SELECT * FROM customers';
    let dataParams = [...countParams];
    
    if (conditions.length > 0) {
      dataQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    dataQuery += ' ORDER BY created_at DESC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
    dataParams.push(limit, offset);
    
    const res = await pool.query(dataQuery, dataParams);
    return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  } catch (error) {
    logger.error('Error listing customers', { error: error.message });
    throw new Error('Failed to list customers');
  }
}

/**
 * Get customer by ID
 */
async function getCustomer(customerId) {
  try {
    let res = await pool.query('SELECT * FROM customers WHERE customer_id = $1', [customerId]);
    return res.rows[0] || null;
  } catch (error) {
    logger.error('Error getting customer', { error: error.message });
    throw new Error('Failed to get customer');
  }
}

/**
 * Update customer
 */
async function updateCustomer(customerId, updates) {
  try {
    const { name, email, phone, address, customer_type, business_type, status, metadata } = updates;

    let result = await pool.query(
      `UPDATE customers 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address::jsonb),
           customer_type = COALESCE($5, customer_type),
           business_type = COALESCE($6, business_type),
           status = COALESCE($7, status),
           metadata = COALESCE($8, metadata::jsonb),
           updated_at = NOW()
       WHERE customer_id = $9
       RETURNING *`,
      [
        name, email, phone,
        address ? JSON.stringify(address) : null,
        customer_type, business_type, status,
        metadata ? JSON.stringify(metadata) : null,
        customerId
      ]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error updating customer', { error: error.message });
    throw new Error('Failed to update customer');
  }
}

/**
 * Delete customer
 */
async function deleteCustomer(customerId) {
  try {
    let res = await pool.query('DELETE FROM customers WHERE customer_id = $1 RETURNING customer_id', [customerId]);
    return !!res.rows[0];
  } catch (error) {
    logger.error('Error deleting customer', { error: error.message });
    throw new Error('Failed to delete customer');
  }
}

/**
 * Get customer insights
 */
async function getCustomerInsights(customerId) {
  try {
    let customer = await getCustomer(customerId);
    const purchaseHistory = await getCustomerPurchaseHistory(customerId);
    const preferences = await getCustomerPreferences(customerId);

    let aiRequest = {
      task: 'customer_insights',
      parameters: {
        customer_data: customer,
        purchase_history: purchaseHistory,
        preferences: preferences,
        behavior_patterns: await analyzeBehaviorPatterns(customerId),
        churn_risk: await assessChurnRisk(customerId)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

    return {
      customer_id: customerId,
      generated_at: new Date().toISOString(),
      customer_profile: customer,
      purchase_summary: purchaseHistory,
      preferences: preferences,
      insights: aiResponse.insights,
      recommendations: aiResponse.recommendations,
      churn_risk: aiResponse.churn_risk,
      lifetime_value: aiResponse.lifetime_value
    };
  } catch (error) {
    logger.error('Error getting customer insights', { error: error.message });
    throw new Error('Failed to get customer insights');
  }
}

// Helper functions
function generateId() {
  return `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getDemographics(address) {
  return {
    region: address?.state || 'unknown',
    urban_rural: 'rural',
    income_level: 'medium'
  };
}

async function assessMarketPotential(customerType, businessType) {
  return {
    potential: 'high',
    estimated_value: 100000,
    growth_potential: 0.3
  };
}

async function getPersonalizationOpportunities(customerData) {
  return [
    'personalized_product_recommendations',
    'targeted_promotions',
    'custom_pricing_tiers'
  ];
}

async function getCustomerPurchaseHistory(customerId) {
  let res = await pool.query(
    `SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [customerId]
  );
  return res.rows;
}

async function getCustomerPreferences(customerId) {
  let res = await pool.query(
    'SELECT * FROM customer_preferences WHERE customer_id = $1',
    [customerId]
  );
  return res.rows[0] || {};
}

async function analyzeBehaviorPatterns(customerId) {
  return {
    purchase_frequency: 'monthly',
    average_order_value: 5000,
    preferred_categories: ['grains', 'vegetables'],
    peak_purchase_times: ['morning', 'weekend']
  };
}

async function assessChurnRisk(customerId) {
  return {
    risk_level: 'low',
    probability: 0.15,
    factors: ['recent_activity', 'positive_feedback']
  };
}

module.exports = {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerInsights
};
