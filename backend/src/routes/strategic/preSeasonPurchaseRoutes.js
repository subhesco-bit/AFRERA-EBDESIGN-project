/**
 * pre Season Purchase Routes
 * Placeholder route module
 */

const express = require('express');
const router = express.Router();

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    module: 'preSeasonPurchaseRoutes',
    status: 'operational'
  });
});

module.exports = router;
