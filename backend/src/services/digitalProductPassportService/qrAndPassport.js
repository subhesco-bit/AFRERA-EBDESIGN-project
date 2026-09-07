/**
 * Digital Product Passport: QR Code Generation (CAP-280) and the aggregate
 * full-passport lookup endpoint. Split out of the former monolithic
 * services/digitalProductPassportService.js (M11).
 */

const express = require('express');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');
const pool = require('../../database/pool');
// Loaded on first QR generation, not at import — see authService for why.
const QRCode = { toDataURL: (...args) => require('qrcode').toDataURL(...args) };

const router = express.Router();

// ============================================================================
// QR CODE GENERATION (CAP-280)
// ============================================================================

/**
 * Generate QR code for product
 */
router.post('/qr-code', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id, data } = req.body;

    // Generate QR code data URL
    const qrData = JSON.stringify({
      product_id,
      batch_id,
      timestamp: new Date().toISOString(),
      verification_url: `${process.env.BASE_URL || 'https://afrera.com'}/verify/${product_id}/${batch_id}`
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Store QR code record
    const result = await pool.query(
      `INSERT INTO qr_codes
       (product_id, batch_id, qr_data, qr_code_image, generated_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [product_id, batch_id, qrData, qrCodeDataURL, req.user.id]
    );

    logger.info(`QR code generated for product ${product_id}`);
    res.status(201).json({
      qr_code_id: result.rows[0].id,
      qr_code_image: qrCodeDataURL,
      qr_data: qrData
    });
  } catch (error) {
    logger.error('Generate QR code error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

/**
 * Get QR code
 */
router.get('/qr-code/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM qr_codes WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get QR code error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get QR code' });
  }
});

/**
 * Get complete digital product passport
 */
router.get('/passport/:product_id/:batch_id', authMiddleware, async (req, res) => {
  try {
    const { product_id, batch_id } = req.params;

    // Get all passport data
    const [productInfo, batchInfo, farmInfo, farmerInfo, certInfo,
          processingInfo, logisticsInfo, sustainabilityInfo, carbonInfo,
          qualityInfo, recallInfo, qrInfo] = await Promise.all([
      pool.query('SELECT * FROM product_ids WHERE product_id = $1', [product_id]),
      pool.query('SELECT * FROM batch_tracking WHERE product_id = $1 AND batch_number = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM farm_information WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM farmer_information WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM certification_information WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM processing_history WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM logistics_history WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM sustainability_data WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM carbon_data WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM quality_reports WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM recall_status WHERE product_id = $1 AND batch_id = $2', [product_id, batch_id]),
      pool.query('SELECT * FROM qr_codes WHERE product_id = $1 AND batch_id = $2 ORDER BY created_at DESC LIMIT 1', [product_id, batch_id])
    ]);

    const passport = {
      product_id,
      batch_id,
      product_information: productInfo.rows[0] || null,
      batch_information: batchInfo.rows[0] || null,
      farm_information: farmInfo.rows[0] || null,
      farmer_information: farmerInfo.rows[0] || null,
      certification_information: certInfo.rows[0] || null,
      processing_history: processingInfo.rows,
      logistics_history: logisticsInfo.rows,
      sustainability_data: sustainabilityInfo.rows[0] || null,
      carbon_data: carbonInfo.rows[0] || null,
      quality_reports: qualityInfo.rows,
      recall_status: recallInfo.rows[0] || null,
      qr_code: qrInfo.rows[0] || null,
      generated_at: new Date().toISOString()
    };

    res.json(passport);
  } catch (error) {
    logger.error('Get digital product passport error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get digital product passport' });
  }
});

module.exports = router;
