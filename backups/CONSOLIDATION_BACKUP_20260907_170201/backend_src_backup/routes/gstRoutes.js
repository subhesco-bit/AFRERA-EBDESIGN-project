/**
 * GST Routes
 * Express routes for GST service
 */

const express = require('express');
const { logger } = require('../utils/logger');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { PLATFORM_STAFF_ROLES } = require('../middleware/roleGroups');
const GSTService = require('../services/legacy/gstService');

const router = express.Router();
const gstService = GSTService;

// ============================================================================
// GST CALCULATION ROUTES
// ============================================================================

/**
 * Calculate GST for an order
 */
router.post('/calculate/order/:orderId', authMiddleware, async (req, res) => {
  try {
    const result = await gstService.calculateOrderGST(req.params.orderId);
    res.json(result);
  } catch (error) {
    logger.error('Calculate order GST API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to calculate order GST' });
  }
});

/**
 * Calculate GST for a single product
 */
router.post('/calculate/product', authMiddleware, async (req, res) => {
  try {
    const result = await gstService.calculateProductGST(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Calculate product GST API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to calculate product GST' });
  }
});

/**
 * Get GST summary for a period
 */
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    const result = await gstService.getGSTSummary(startDate, endDate);
    res.json(result);
  } catch (error) {
    logger.error('Get GST summary API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get GST summary' });
  }
});

// ============================================================================
// GST INVOICE ROUTES
// ============================================================================

/**
 * Generate GST invoice for an order
 */
router.post('/invoice/:orderId', authMiddleware, async (req, res) => {
  try {
    const result = await gstService.generateGSTInvoice(req.params.orderId);
    res.json(result);
  } catch (error) {
    logger.error('Generate GST invoice API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate GST invoice' });
  }
});

/**
 * Update order with GST details
 */
router.put('/order/:orderId/gst', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const result = await gstService.updateOrderGST(req.params.orderId, req.body);
    res.json(result);
  } catch (error) {
    logger.error('Update order GST API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update order GST' });
  }
});

// ============================================================================
// GST VALIDATION ROUTES
// ============================================================================

/**
 * Validate GST number format
 */
router.post('/validate/gst-number', async (req, res) => {
  try {
    const { gstNumber } = req.body;
    if (!gstNumber) {
      return res.status(400).json({ error: 'GST number is required' });
    }
    const isValid = gstService.validateGSTNumber(gstNumber);
    res.json({ 
      gstNumber,
      isValid,
      message: isValid ? 'Valid GST number format' : 'Invalid GST number format'
    });
  } catch (error) {
    logger.error('Validate GST number API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to validate GST number' });
  }
});

/**
 * Get GST rate for product category
 */
router.get('/rate/:category', async (req, res) => {
  try {
    const rate = gstService.getGSTRate(req.params.category);
    res.json({ 
      category: req.params.category,
      gstRate: rate 
    });
  } catch (error) {
    logger.error('Get GST rate API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get GST rate' });
  }
});

// ============================================================================
// GST RATES MANAGEMENT ROUTES
// ============================================================================

/**
 * Get all active GST rates
 */
router.get('/rates', authMiddleware, async (req, res) => {
  try {
    const pool = gstService.pool;
    const result = await pool.query(
      'SELECT * FROM gst_rates WHERE is_active = true ORDER BY product_category'
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Get GST rates API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get GST rates' });
  }
});

/**
 * Add or update GST rate
 */
router.post('/rates', authMiddleware, async (req, res) => {
  try {
    const { productCategory, gstRate, hsnCode, description, effectiveDate } = req.body;
    
    if (!productCategory || !gstRate || !effectiveDate) {
      return res.status(400).json({ 
        error: 'productCategory, gstRate, and effectiveDate are required' 
      });
    }

    const pool = gstService.pool;
    const result = await pool.query(
      `INSERT INTO gst_rates 
       (product_category, gst_rate, hsn_code, description, effective_date, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (product_category) 
       DO UPDATE SET 
         gst_rate = EXCLUDED.gst_rate,
         hsn_code = EXCLUDED.hsn_code,
         description = EXCLUDED.description,
         effective_date = EXCLUDED.effective_date,
         is_active = true,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [productCategory, gstRate, hsnCode, description, effectiveDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Add GST rate API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to add GST rate' });
  }
});

/**
 * Deactivate GST rate
 */
router.delete('/rates/:category', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const pool = gstService.pool;
    const result = await pool.query(
      'UPDATE gst_rates SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE product_category = $1 RETURNING *',
      [req.params.category]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'GST rate not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Deactivate GST rate API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to deactivate GST rate' });
  }
});

// ============================================================================
// GST RETURNS ROUTES
// ============================================================================

/**
 * Create GST return
 */
router.post('/returns', authMiddleware, async (req, res) => {
  try {
    const {
      returnPeriod,
      returnType,
      taxpayerGstNumber,
      taxpayerName,
      taxpayerState,
      dueDate,
      totalTurnover,
      totalTaxLiability
    } = req.body;

    const pool = gstService.pool;
    const result = await pool.query(
      `INSERT INTO gst_returns 
       (return_period, return_type, taxpayer_gst_number, taxpayer_name, taxpayer_state, 
        due_date, total_turnover, total_tax_liability, return_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [returnPeriod, returnType, taxpayerGstNumber, taxpayerName, taxpayerState, 
       dueDate, totalTurnover, totalTaxLiability]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create GST return API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create GST return' });
  }
});

/**
 * Get GST returns
 */
router.get('/returns', authMiddleware, async (req, res) => {
  try {
    const { taxpayerGstNumber, returnType, status, startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM gst_returns WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (taxpayerGstNumber) {
      paramCount++;
      query += ` AND taxpayer_gst_number = $${paramCount}`;
      params.push(taxpayerGstNumber);
    }

    if (returnType) {
      paramCount++;
      query += ` AND return_type = $${paramCount}`;
      params.push(returnType);
    }

    if (status) {
      paramCount++;
      query += ` AND return_status = $${paramCount}`;
      params.push(status);
    }

    if (startDate) {
      paramCount++;
      query += ` AND due_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND due_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ' ORDER BY due_date DESC';

    const pool = gstService.pool;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get GST returns API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get GST returns' });
  }
});

/**
 * Update GST return status
 */
router.put('/returns/:returnId/status', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const { returnStatus, acknowledgmentNumber, filedBy } = req.body;

    const pool = gstService.pool;
    const result = await pool.query(
      `UPDATE gst_returns 
       SET return_status = $1, 
           acknowledgment_number = $2,
           filed_by = $3,
           filing_date = CURRENT_DATE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [returnStatus, acknowledgmentNumber, filedBy, req.params.returnId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'GST return not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update GST return status API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update GST return status' });
  }
});

// ============================================================================
// GST PAYMENTS ROUTES
// ============================================================================

/**
 * Create GST payment
 */
router.post('/payments', authMiddleware, async (req, res) => {
  try {
    const {
      returnId,
      paymentType,
      taxType,
      amount,
      paymentDate,
      paymentMethod,
      transactionId
    } = req.body;

    const pool = gstService.pool;
    const result = await pool.query(
      `INSERT INTO gst_payments 
       (return_id, payment_type, tax_type, amount, payment_date, payment_method, transaction_id, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [returnId, paymentType, taxType, amount, paymentDate, paymentMethod, transactionId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create GST payment API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create GST payment' });
  }
});

/**
 * Get GST payments
 */
router.get('/payments', authMiddleware, async (req, res) => {
  try {
    const { returnId, paymentType, status, startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM gst_payments WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (returnId) {
      paramCount++;
      query += ` AND return_id = $${paramCount}`;
      params.push(returnId);
    }

    if (paymentType) {
      paramCount++;
      query += ` AND payment_type = $${paramCount}`;
      params.push(paymentType);
    }

    if (status) {
      paramCount++;
      query += ` AND payment_status = $${paramCount}`;
      params.push(status);
    }

    if (startDate) {
      paramCount++;
      query += ` AND payment_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND payment_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ' ORDER BY payment_date DESC';

    const pool = gstService.pool;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get GST payments API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get GST payments' });
  }
});

/**
 * Update GST payment status
 */
router.put('/payments/:paymentId/status', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const { paymentStatus, challanNumber, bankName, branchName } = req.body;

    const pool = gstService.pool;
    const result = await pool.query(
      `UPDATE gst_payments 
       SET payment_status = $1,
           challan_number = $2,
           bank_name = $3,
           branch_name = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [paymentStatus, challanNumber, bankName, branchName, req.params.paymentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'GST payment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update GST payment status API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update GST payment status' });
  }
});

module.exports = router;
